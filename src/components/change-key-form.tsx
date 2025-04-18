"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form";
import { KeyType, passwordValidator } from "@/data/client/models";
import { PasswordInput } from "./ui/password-input";
import { ReactElement, useContext, useEffect, useState } from "react"
import { Checkbox } from "./ui/checkbox";
import NoSSR  from "react-no-ssr"
import { CreateDatabaseResult, DatabaseContext } from "@/contexts/db-context";
import { generatePassword } from "@/lib/crypto";
import { CopyIcon, EyeIcon, EyeOffIcon, WandIcon } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";
import { KeyContext } from "@/contexts/key-context";
import { useTranslation } from "react-i18next";


interface ChangeKeyFormProps {
}

export function ChangeKeyForm({  
}: ChangeKeyFormProps) {
  const { register, setValue, getValues, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      currentKey: '',
      key: generatePassword()
    }
  });

  const [operationResult, setOperationResult] = useState<CreateDatabaseResult | null>(null);
  const [showPassword, setShowPassword] = useState(false)
  const [printKey, setPrintKey] = useState<ReactElement | null>(null);
  const [keepLoggedIn, setKeepLoggedIn] = useState(typeof localStorage !== 'undefined' ? localStorage.getItem("keepLoggedIn") === "true" : false)
  const dbContext = useContext(DatabaseContext);
  const keyContext = useContext(KeyContext);
  const { t } = useTranslation();

  useEffect(() => { 
    setOperationResult(null);
    // TODO: load credentials from local storage
  }, []);
  const handleChangeKey = handleSubmit(async (data) => {
    // Handle form submission

    if (dbContext?.password !== data.currentKey) {
      setOperationResult({ success: false, message: t("Current password is incorrect"), issues: [] });
      toast.error(t('Current password is incorrect'));
    } else  {

      const newKeyResult = await keyContext.addKey(dbContext?.email, t('Owner Key'), data.key, null, {
        role: 'owner',
        features: ['*']
      }, {
        type: KeyType.User
      });
      if (newKeyResult.status === 200) {
        dbContext?.setPassword(data.key);

        const deleteOldKeyResult = await keyContext.removeKey(dbContext.keyLocatorHash)

        if(deleteOldKeyResult.status !== 200) {
          setOperationResult({ success: false, message: t("Error while changing password"), issues: deleteOldKeyResult.issues ?? []});
          toast.error(t('Error while changing key'));
          return;
        } else {
          setOperationResult({ success: true, message: t("Password has been successfully changed"), issues: [] });
          toast.success(t('Password has been successfully changed'));

          if (keepLoggedIn){
            localStorage.setItem("email", dbContext?.email);
            localStorage.setItem("key", data.key);
          }
        }
      } else {
        setOperationResult({ success: false, message: t("Error while changing password"), issues: newKeyResult.issues ?? []});
        toast.error(t('Error while changing password'));
        return;
      }
    }

  });

  if (operationResult?.success) {
    return (<div className="flex flex-col space-y-2 gap-2 mb-4">
      <h2 className="text-green-500 text-bold">{t('Congratulations!')}</h2>
      <p className="text-sm">{t('Database Key has been changed. Please store the credentials in safe place as they are ')}<strong>{t('NEVER send to server')}</strong>{t(' and thus ')}<strong>{t('CAN NOT be recovered')}</strong></p>
      <div className="border-2 border-dashed border-green-400 p-5">
        <div className="text-sm mb-5">
          <Label htmlFor="current">{t('E-mail:')}</Label>
          <Input type="password" id="email" readOnly value={dbContext?.email} />
        </div>
        <div className="text-sm">
          <Label htmlFor="password">{t('User Password:')}</Label>
          <Textarea id="password" readOnly value={dbContext?.password} />
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="p-1 h-10 p-2" onClick={async (e) => {
            e.preventDefault();
            const textToCopy = 'Database Id: '+ dbContext?.email + "\nKey Id: " + dbContext?.password;
            if ('clipboard' in navigator) {
              navigator.clipboard.writeText(textToCopy);
            } else {
              document.execCommand('copy', true, textToCopy);
            }                
          }}><CopyIcon className="w-4 h-4" /> {t('Copy to clipboard')}</Button>             
        </div>
      </div>


      <Button onClick={() => {
        setOperationResult(null);
        dbContext?.authorize({ // this will authorize the database and in a side effect close this popup
          email: dbContext?.email,
          key: dbContext?.password,
          keepLoggedIn: keepLoggedIn
        });
      }}>{t('Go to application')}</Button>
    </div>)
  } else  {
    return (
      <form onSubmit={handleChangeKey}>
        <div className="flex flex-col space-y-2 gap-2 mb-4">
          {operationResult ? (
            <div>
              <p className={operationResult.success ? "p-3 border-2 border-green-500 background-green-200 text-sm font-semibold text-green-500" : "background-red-200 p-3 border-red-500 border-2 text-sm font-semibold text-red-500"}>{operationResult.message}</p>
              <ul>
                {operationResult.issues.map((issue, index) => (
                  <li key={index}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <Label htmlFor="currentKey">{t('Current Password')}</Label>
          <Input autoFocus 
            type="text"
            id="currentKey"
            {...register("currentKey", { required: true,
              validate: {
                currentKey: passwordValidator
              }
            })}
          />
          {errors.currentKey && <span className="text-red-500 text-sm">{t('Key must be at least 8 characters length including digits, alpha, lower and upper letters.')}</span>} 

        </div>
        <div className="flex flex-col space-y-2 gap-2 mb-4">
              <Label htmlFor="key">New User Password</Label>
              <div className="flex gap-2">
                <div className="relative">
                  <PasswordInput autoComplete="new-password" id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register("key", { required: true,
                          validate: {
                              key: passwordValidator
                          }            
                          })}                        />
                      <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent z-0"
                          onClick={() => setShowPassword((prev) => !prev)}
                      >
                          {showPassword ? (
                          <EyeIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                          />
                          ) : (
                          <EyeOffIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                          />
                          )}
                          <span className="sr-only">
                          {showPassword ? t("Hide password") : t("Show password")}
                          </span>
                      </Button>

                      {/* hides browsers password toggles */}
                      <style>{`
                          .hide-password-toggle::-ms-reveal,
                          .hide-password-toggle::-ms-clear {
                          visibility: hidden;
                          pointer-events: none;
                          display: none;
                          }
                      `}</style>
                </div>
                <Button variant="outline" className="p-1 h-10 w-10" onClick={(e) => {
                  e.preventDefault();
                  setValue('key', generatePassword());
                  setShowPassword(true);
                }}><WandIcon className="w-4 h-4" /></Button>
                <Button variant="outline" className="p-1 h-10 w-10" onClick={async (e) => {
                  e.preventDefault();
                  const textToCopy = 'E-mail: '+ dbContext?.email + "\nPassword: " + getValues().key;
                  if ('clipboard' in navigator) {
                    navigator.clipboard.writeText(textToCopy);
                  } else {
                    document.execCommand('copy', true, textToCopy);
                  }                
                }}><CopyIcon className="w-4 h-4" /></Button>              
              </div>
              <div>
                {printKey}
              </div>
              {errors.key && <span className="text-red-500 text-sm">{t('Password must be at least 8 characters length including digits, alpha, lower and upper letters.')}</span>}
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
          </p>        
        </div>
        <div className="flex items-center justify-between gap-4 mt-4">
          <NoSSR>
            <div className="flex items-center gap-2">
              <Checkbox
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onCheckedChange={(checked) => {
                  setKeepLoggedIn(!!checked);
                  localStorage.setItem("keepLoggedIn", checked.toString());
                      }}
              />
              <label htmlFor="keepLoggedIn" className="text-sm">{t('Keep me logged in')}</label>
            </div>      
          </NoSSR>
          <div className="items-center flex justify-center">
              <Button type="submit">{t('Change password')}</Button>
          </div>
        </div>
      </form>
    );
  }
}
