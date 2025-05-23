"use client"

import { Card, CardContent, CardHeader } from "./ui/card";
import { useEffect, useState } from 'react';
import DataLoader from './data-loader';
import { useTheme } from 'next-themes';
import { CookieConsentBannerComponent } from '@/components/cookie-consent-banner';
import FeedbackWidget from './feedback-widget';
import { useTranslation } from 'react-i18next';
import { SharingAuthorizeForm } from './sharing-authorize-form';

export function SharingPopup({ autoLoginInProgress, databaseIdHash, eem }: { autoLoginInProgress: boolean, databaseIdHash: string, eem: string }) {
  const [applicationLoaded, setApplicationLoaded] = useState(false);
  const { t } = useTranslation();
  const { theme, systemTheme } = useTheme();
  const currentTheme = (theme === 'system' ? systemTheme : theme)
  const { i18n } = useTranslation();


  useEffect(() => {
    setApplicationLoaded(true);
  },[]);

  return (
    <div className="p-4 grid items-center justify-center h-screen">
     {!applicationLoaded || autoLoginInProgress ? (<div className="w-96 flex items-center justify-center flex-col"><div className="flex-row h-40 w-40"><img src={currentTheme === 'dark' ? "/img/OAB-Logo-Small-dark.svg" : "/img/OAB-Logo-Small.svg"} /></div><div><DataLoader /></div></div>):(
      <div className="max-w-600">
        <div className="flex">
          <img alt="Application logo" className="w-16 mr-5" src={currentTheme === 'dark' ? `/img/OAB-Logo-Small-dark.svg` : `/img/OAB-Logo-Small-dark.svg`} />
          <h1 className="text-5xl text-center p-8 pl-0">{t('Open Agents Builder')}</h1>
        </div>        
        <Card>
          <CardHeader className="text-sm">
            {t('Enter the Password you have been provided by the data owner to Accept the invitation')}
          </CardHeader>
          <CardContent className="space-y-2">
            <SharingAuthorizeForm eem={eem} databaseIdHash={databaseIdHash} />
          </CardContent>
        </Card>
        <div id="language-selector">
          <button className="text-xs m-2" onClick={() => i18n.changeLanguage('en')}>🇺🇸 English</button>
          <button className="text-xs m-2" onClick={() => i18n.changeLanguage('pl')}>🇵🇱 Polski</button>
        </div>
      </div>)}
      <FeedbackWidget />
      <CookieConsentBannerComponent />
     </div>
  )
}