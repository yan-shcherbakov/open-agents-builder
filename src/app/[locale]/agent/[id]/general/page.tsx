'use client'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAgentContext } from '@/contexts/agent-context';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Agent } from '@/data/client/models';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import useFormPersist from 'react-hook-form-persist'
import { sha256 } from '@/lib/crypto';
import { boolean } from 'drizzle-orm/mysql-core';


export function onAgentSubmit(agent: Agent | null, watch, setValue, updateAgent: (agent: Agent, setAsCurrent: boolean) => Promise<Agent>, t, router) {
  const { clear } = useFormPersist(`agent-general-${agent?.id}`, {
    watch,
    setValue,
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (agent) {
      const savedFormState = sessionStorage.getItem(`agent-general-${agent.id}`);
      console.log(agent.id)
      console.log(savedFormState)
      agent.toForm(setValue); // load the database values
      (async () => {
          const getSortedFormStateString = (formState: Record<string, any>) => {
            const sortedFormState = Object.keys(formState).sort().reduce((acc, key) => {
            acc[key] = formState[key];
            return acc;
            }, {});
            return Object.entries(sortedFormState).map(([key, value]) => `${key}:${value}`).join(',');
          };

          const savedFormStateString = getSortedFormStateString(JSON.parse(savedFormState));
          const currentFormStateString = getSortedFormStateString(agent.toForm(null));
          console.log(savedFormStateString);
          console.log(currentFormStateString);

          const [savedFormStateHash, currentFormStateHash] = await Promise.all([
            sha256(savedFormStateString, ''),
            sha256(currentFormStateString, '')
          ]);

        console.log(savedFormStateHash, currentFormStateHash);
        if (savedFormStateHash !== currentFormStateHash) {
          setIsDirty(true);
        } else {
          setIsDirty(false);
        }
      })();
    }
    
  }, [agent, setValue]);

  const onSubmit = async (data: Record<string, any>) => {

    const updatedAgent = Agent.fromForm(data);
    try {
      const response = await updateAgent(updatedAgent, true);
      toast.success(t('Agent updated successfully'));
      clear(); // clear local storage

      router.push(`/agent/${response.id}/general`);
    } catch (e) {
      console.error(e);
      toast.error(t('Failed to update agent'));
    }
  };
  return { onSubmit, isDirty, setIsDirty }
}


export default function GeneralPage() {


  const { t } = useTranslation();
  const router = useRouter();
  const { current: agent, updateAgent } = useAgentContext();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: agent ? agent.toForm(null) : {},
  });  

  const { onSubmit, isDirty } = onAgentSubmit(agent, watch, setValue, updateAgent, t, router);
   
  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium">
        {t('Agent Name')}
        </label>
        <Input
        type="text"
        id="displayName"
        {...register('displayName', { required: t('This field is required') })}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.displayName && <p className="mt-2 text-sm text-red-600">{errors.displayName.message}</p>}
      </div>
      <div>
        <label htmlFor="welcomeInfo" className="block text-sm font-medium">
        {t('Welcome Message')}
        </label>
        <Textarea
        id="welcomeInfo"
        {...register('welcomeInfo')}
        rows={4}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.welcomeInfo && <p className="mt-2 text-sm text-red-600">{errors.welcomeInfo.message}</p>}
      </div>
      <div>
        <label htmlFor="termsConditions" className="block text-sm font-medium">
        {t('Terms and Conditions')}
        </label>
        <Textarea
        id="termsConditions"
        {...register('termsConditions')}
        rows={4}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.termsConditions && <p className="mt-2 text-sm text-red-600">{errors.termsConditions.message}</p>}
      </div>
      <div>
        <label htmlFor="confirmTerms" className="flex items-center text-sm font-medium">
        <Input
          type="checkbox"
          id="confirmTerms"
          {...register('confirmTerms')}
          className="mr-2 w-4"
        />
        {t('Must confirm terms and conditions')}
        </label>
        {errors.confirmTerms && <p className="mt-2 text-sm text-red-600">{errors.confirmTerms.message}</p>}
      </div>
      <div>
        <label htmlFor="resultEmail" className="block text-sm font-medium">
        {t('Result Email')}
        </label>
        <Input
        type="email"
        id="resultEmail"
        {...register('resultEmail', { pattern: { value: /^\S+@\S+$/i, message: t('Invalid email address') } })}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.resultEmail && <p className="mt-2 text-sm text-red-600">{errors.resultEmail.message}</p>}
      </div>
      <div>
        <label htmlFor="collectUserInfo" className="flex items-center text-sm font-medium">
        <Input
          type="checkbox"
          id="collectUserInfo"
          {...register('collectUserInfo')}
          className="mr-2 w-4"
        />
        {t('Collect user e-mail addresses and names')}
        </label>
        {errors.collectUserInfo && <p className="mt-2 text-sm text-red-600">{errors.collectUserInfo.message}</p>}
      </div>
      <div>
        <Button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
        {t('Save')}
        </Button>
        {isDirty && <p className="mt-2 text-sm text-red-600">{t('You have unsaved changes')}</p>}
      </div>
      </form>
    </div>
  );
}

