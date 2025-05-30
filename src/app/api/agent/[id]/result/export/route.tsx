import { ResultDTO } from "@/data/dto";
import ServerResultRepository from "@/data/server/server-result-repository";
import { auditLog, authorizeSaasContext, genericGET } from "@/lib/generic-api";
import { authorizeRequestContext } from "@/lib/authorization-api";
import { NextRequest, NextResponse } from "next/server";
import JSZip, { file } from 'jszip'
import showdown from "showdown";
import filenamify from 'filenamify';
import { render } from 'json2html';
import fs from 'fs/promises';
import { getErrorMessage } from "@/lib/utils";


export async function GET(request: NextRequest, response: NextResponse) {
    try {
        const requestContext = await authorizeRequestContext(request, response);
        const saasContext = await authorizeSaasContext(request);
        
        const resultRepo = new ServerResultRepository(requestContext.databaseIdHash, saasContext.isSaasMode ? saasContext.saasContex?.storageKey : null);
        const allResults = await resultRepo.findAll();

        const zip = new JSZip();
        const converter = new showdown.Converter({ tables: true, completeHTMLDocument: true, openLinksInNewWindow: true });
        converter.setFlavor('github');

        let indexMd = '# Open Agents Builder Export\n\n';

        for (const result of allResults) {
            if (result.content) {
                const recordNiceName = filenamify((result.createdAt + ' - ' + result.sessionId), {replacement: '-'});
                indexMd += ` - <a href="${recordNiceName}.md">${result.createdAt} - ${result.sessionId}</a>\n\n`;

                let html = ''
                if (result.format?.toLowerCase() === 'markdown') {
                    html = converter.makeHtml(result.content);
                    zip.file(`${recordNiceName}.md`, result.content);
                } 

                if (result.format?.toLowerCase() === 'json') {
                    html = render(result.content);
                    zip.file(`${recordNiceName}.json`, JSON.stringify(result.content));
                }
                    
                zip.file(`${recordNiceName}.html`, html);
            }
        }
        zip.file('index.md', indexMd);
        zip.file('index.html', converter.makeHtml(indexMd.replaceAll('.md', '.html')));
        zip.file('results.json', JSON.stringify(allResults));

        const headers = new Headers();

        headers.set("Content-Type", "application/zip");
        const zipFileContent = await zip.generateAsync({type:"blob"});
        headers.set("Content-Length", zipFileContent.size.toString());

        auditLog({
            eventName: 'exportResults',
            recordLocator: JSON.stringify({ sessionId: allResults.map(r => r.sessionId) })
        }, request, requestContext, saasContext);

        // or just use new Response ❗️
        return new NextResponse(zipFileContent, { status: 200, statusText: "OK", headers });
    } catch (error) {
        console.error(error);

        return Response.json({ message: getErrorMessage(error), status: 499 }, {status: 499});
} 
}

