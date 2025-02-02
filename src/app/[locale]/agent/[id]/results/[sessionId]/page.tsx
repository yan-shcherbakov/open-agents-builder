'use client'
import { useAgentContext } from '@/contexts/agent-context';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Result, Session } from '@/data/client/models';
import { RenderResult } from '@/components/render-result';
import { Tabs } from '@/components/ui/tabs';
import { TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { ChatMessages, DisplayToolResultsMode } from '@/components/chat-messages';
import ResultDetails from '@/components/result-details';
import { Button } from '@/components/ui/button';
import { CopyIcon, MoveLeftIcon, SaveIcon, WandSparkles } from 'lucide-react';
import { useCopyToClipboard } from 'react-use';


export default function SingleResultPage() {

  const [, copy] = useCopyToClipboard();
  const agentContext = useAgentContext();
  const params = useParams();

  const { t, i18n  } = useTranslation();

  const [result, setResult] = useState<Result>();
  const [session, setSession] = useState<Session>();
  const [chatOpen, setChatOpen] = useState(false);


  useEffect(() => {
    if (agentContext.current?.id)
      agentContext.singleResult(params.sessionId as string).catch((e) => {
        toast.error(getErrorMessage(e));
      }).then((result) => {
        if (result) setResult(result);
      });

      agentContext.singleSession(params.sessionId as string).catch((e) => {
        toast.error(getErrorMessage(e));
      }).then((session) => {
        if (session) { 
          setSession(session);
          console.log(session.messages)
        }
      });
  }, [agentContext.current]);


  return (
    <div className="space-y-6">
            <Button size="sm" variant="outline" onClick={() => history.back()}><MoveLeftIcon /> {t('Back')}</Button>
      <Card>
        {/* <CardHeader>
          <CardTitle>
            {new Date(result?.createdAt ?? Date.now()).toLocaleString()} {result?.userName} {result?.userEmail ? `- ${result.userEmail}` : ''}
          </CardTitle>  
        </CardHeader> */}
        <CardContent className="pt-6">
          <ResultDetails 
            sessionId={result?.sessionId || ''}
            userName={result?.userName || ''}
            userEmail={result?.userEmail || ''}
            sessionStart={new Date(session?.createdAt ?? Date.now())}
            sessionEnd={new Date(result?.finalizedAt ?? Date.now())}
            messageCount={session?.messages?.length ?? 0}
            inputTokens={0} // TODO: implement inputTokens,
            outputTokens={0} // TODO: implement outputTokens,            
          /> 
          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid grid-cols-2">
                <TabsTrigger value="content" className="dark:data-[state=active]:bg-zinc-900 data-[state=active]:bg-zinc-100 data-[state=active]:text-gray-200 p-2 rounded-md text-sm">{t('Result')}</TabsTrigger>
                <TabsTrigger value="chat" className="dark:data-[state=active]:bg-zinc-900 data-[state=active]:bg-zinc-100 data-[state=active]:text-gray-200 p-2 rounded-md text-sm">{t('Message history')}</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="p-2 text-sm">
              <RenderResult result={result} />
              <Button size="sm" variant="outline" className="mt-2" onClick={(e) => {
                try {
                  if(result?.content) copy(result?.content)
                    toast.info(t('Copied to clipboard!'));
                } catch (e){
                  toast.error(getErrorMessage(e))
                }
              }}>
                <CopyIcon className="w-4 h-4" />{t('Copy')}
              </Button>              
              <Button size="sm" variant="outline" className="mt-2" onClick={(e) => {
                if (result) agentContext.exportSingleResult(result)
              }}>
                <SaveIcon className="w-4 h-4" />{t('Export to file')}
              </Button>
              <Button size="sm" variant="outline" className="mt-2" onClick={(e) => {
                setChatOpen(true);
              }}>
                <WandSparkles className="w-4 h-4" />{t('Transform with AI')}
              </Button>
            </TabsContent>      
            <TabsContent value="chat" className="p-2 text-sm">
              <ChatMessages 
                    displayToolResultsMode={DisplayToolResultsMode.AsTextMessage}
                    messages={session?.messages ?? []}
                />
              </TabsContent>
          </Tabs>                  
        </CardContent>
      </Card>

    </div>
  );
}