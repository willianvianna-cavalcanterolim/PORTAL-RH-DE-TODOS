import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { HERO_BANNER_PATH } from '../data/seedData';
import { MonogramLogo } from './MonogramLogo';
import { ImageProcessor } from './ImageProcessor';

interface CorporateAuthGateProps {
  unverifiedUser: User | null;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (name: string, email: string, password: string) => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onReloadVerification: () => Promise<void>;
  onResendVerification: () => Promise<void>;
  onSignOut: () => Promise<void>;
  customLogoUrl?: string;
}

export const CorporateAuthGate: React.FC<CorporateAuthGateProps> = ({
  unverifiedUser,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  onGoogleSignIn,
  onReloadVerification,
  onResendVerification,
  onSignOut,
  customLogoUrl,
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'reset'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'info'; message: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setBusy(true);
    try {
      if (authTab === 'login') {
        await onEmailSignIn(email.trim(), password);
      } else if (authTab === 'register') {
        await onEmailSignUp(fullName.trim(), email.trim(), password);
        setFeedback({
          type: 'info',
          message:
            'Cadastro criado. Enviamos um link de confirmação para o seu e-mail para liberar o acesso ao portal.',
        });
      } else {
        await onPasswordReset(email.trim());
        setFeedback({
          type: 'info',
          message:
            'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível autenticar.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleClick = async () => {
    setFeedback(null);
    setBusy(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao autenticar via Google.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 bg-[#F8F7F4] dark:bg-[#0B1410]">
      {/* Coluna Esquerda: Apresentação Institucional & Arquitetura de Acesso */}
      <div className="lg:col-span-7 relative overflow-hidden bg-[#11382B] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#C5A467]/40">
        <ImageProcessor
          src={HERO_BANNER_PATH}
          alt="Empreendimento Cavalcante & Rolim"
          aspectRatio="16:9"
          fitMode="cover"
          variant="hero"
          fillContainer
          goldBorder={false}
          roundedClassName="rounded-none"
          containerClassName="absolute inset-0"
          imgClassName="opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(11,36,27,0.92) 0%, rgba(17,56,43,0.82) 55%, rgba(17,56,43,0.72) 100%)',
          }}
        />

        <div className="relative z-10 space-y-6 max-w-xl">
          <MonogramLogo customLogoUrl={customLogoUrl} onDarkSurface />
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8BC83] font-semibold mb-3">
              Ambiente Corporativo Protegido · Signature Spaces
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.1] text-white">
              Portal Oficial de RH &amp; Endomarketing
            </h1>
            <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed">
              O acesso aos comunicados oficiais, documentos do acervo editorial, Academia C&amp;R e ranking interno requer autenticação corporativa verificada.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10 max-w-2xl">
          <div className="p-5 rounded-xl bg-[#0B241B]/85 border border-[#C5A467]/45 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D8BC83]">
              <UserCheck className="w-4 h-4" />
              <span>Modo Colaborador</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Após login e senha verificados, visualize comunicados, conclua treinamentos, confirme leituras e acompanhe suas conquistas no Top 5.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B241B]/85 border border-[#C5A467]/45 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D8BC83]">
              <ShieldCheck className="w-4 h-4" />
              <span>Modo Gestor (Admin)</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Perfis gestores autorizados podem alternar entre a visão administrativa (inserir, corrigir e excluir) e a visão de colaborador a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Painel Profissional de Login, Senha e Verificação */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md bg-white dark:bg-[#11241C] border border-[#C5A467]/55 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {unverifiedUser ? (
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-[#11382B] border border-[#C5A467] flex items-center justify-center text-[#D8BC83]">
                <MailCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-1">
                  Verificação Obrigatória
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                  Confirme seu e-mail corporativo
                </h2>
                <p className="text-xs text-[#1C2421]/75 dark:text-white/75 mt-2 leading-relaxed">
                  Sua conta <span className="font-semibold">{unverifiedUser.email}</span> foi autenticada, mas exige confirmação do link enviado para liberar leitura e interação no portal.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setFeedback(null);
                    try {
                      await onReloadVerification();
                    } catch (err) {
                      setFeedback({
                        type: 'error',
                        message:
                          err instanceof Error ? err.message : 'E-mail ainda não confirmado.',
                      });
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-[#C5A467] ${busy ? 'animate-spin' : ''}`} />
                  <span>Já confirmei meu e-mail — Acessar Portal</span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onResendVerification();
                      setFeedback({
                        type: 'info',
                        message: 'Novo link de verificação reenviado para sua caixa de entrada.',
                      });
                    } catch (err) {
                      setFeedback({
                        type: 'error',
                        message:
                          err instanceof Error ? err.message : 'Aguarde antes de reenviar.',
                      });
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:bg-[#11382B]/5 cursor-pointer"
                >
                  Reenviar e-mail de verificação
                </button>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full py-2 text-xs text-[#1C2421]/65 dark:text-white/65 hover:underline cursor-pointer"
                >
                  Sair ou entrar com outra conta
                </button>
              </div>

              {feedback && (
                <p
                  className={`p-3 rounded-lg text-xs font-medium ${
                    feedback.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                      : 'bg-[#11382B]/8 dark:bg-[#0B241B] text-[#11382B] dark:text-[#D8BC83] border border-[#C5A467]/40'
                  }`}
                >
                  {feedback.message}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold">
                  Autenticação Corporativa
                </p>
                <h2 className="font-serif text-3xl font-semibold text-[#1C2421] dark:text-white">
                  {authTab === 'login'
                    ? 'Entrar no Portal'
                    : authTab === 'register'
                    ? 'Novo Colaborador'
                    : 'Recuperar Senha'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F8F7F4] dark:bg-[#0B1410] border border-[#1C2421]/12 dark:border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setFeedback(null);
                  }}
                  className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'login' || authTab === 'reset'
                      ? 'bg-[#11382B] text-[#D8BC83]'
                      : 'text-[#1C2421]/70 dark:text-white/70 hover:text-[#11382B] dark:hover:text-white'
                  }`}
                >
                  Login e Senha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setFeedback(null);
                  }}
                  className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-[#11382B] text-[#D8BC83]'
                      : 'text-[#1C2421]/70 dark:text-white/70 hover:text-[#11382B] dark:hover:text-white'
                  }`}
                >
                  Criar Acesso
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authTab === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-[#1C2421]/75 dark:text-white/75 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex.: Mariana Albuquerque"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white focus:outline-none focus:border-[#C5A467]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#1C2421]/75 dark:text-white/75 mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@cavalcanterolim.com.br"
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white focus:outline-none focus:border-[#C5A467]"
                  />
                </div>

                {authTab !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-[#1C2421]/75 dark:text-white/75">
                        Senha
                      </label>
                      {authTab === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('reset');
                            setFeedback(null);
                          }}
                          className="text-[11px] font-semibold text-[#11382B] dark:text-[#D8BC83] hover:underline cursor-pointer"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete={
                          authTab === 'login' ? 'current-password' : 'new-password'
                        }
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white focus:outline-none focus:border-[#C5A467]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C2421]/50 dark:text-white/50 hover:text-[#11382B] dark:hover:text-[#D8BC83] cursor-pointer"
                        aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {feedback && (
                  <p
                    className={`p-3 rounded-lg text-xs font-medium leading-relaxed ${
                      feedback.type === 'error'
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                        : 'bg-[#11382B]/8 dark:bg-[#0B241B] text-[#11382B] dark:text-[#D8BC83] border border-[#C5A467]/40'
                    }`}
                  >
                    {feedback.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] disabled:opacity-50 transition-colors text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authTab === 'login' ? (
                    <>
                      <Lock className="w-4 h-4 text-[#C5A467]" />
                      <span>{busy ? 'Autenticando...' : 'Entrar com E-mail e Senha'}</span>
                    </>
                  ) : authTab === 'register' ? (
                    <>
                      <UserPlus className="w-4 h-4 text-[#C5A467]" />
                      <span>{busy ? 'Criando acesso...' : 'Cadastrar Conta de Colaborador'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-[#C5A467]" />
                      <span>{busy ? 'Enviando...' : 'Enviar Link de Redefinição'}</span>
                    </>
                  )}
                </button>

                {authTab === 'reset' && (
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className="w-full text-xs font-medium text-[#11382B] dark:text-[#D8BC83] hover:underline cursor-pointer"
                  >
                    Voltar para Login e Senha
                  </button>
                )}
              </form>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1C2421]/12 dark:border-white/12" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="px-3 bg-white dark:bg-[#11241C] text-[#1C2421]/55 dark:text-white/55">
                    ou acesso corporativo único
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleClick}
                className="w-full py-2.5 px-4 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] disabled:opacity-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Entrar com Conta Google (SSO)
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
