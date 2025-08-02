
import { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Stethoscope, Loader, Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  const { signIn } = useAuth();
  const { addToast } = useToast();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@fisioflow.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearErrors();

    try {
      const response = await signIn(data.email, data.password);
      
      if (response.error) {
        setError('root', { 
          type: 'manual', 
          message: response.error 
        });
        addToast({
          type: 'error',
          title: 'Erro no Login',
          message: response.error,
        });
        return;
      }

      if (response.user) {
        addToast({
          type: 'success',
          title: 'Login realizado com sucesso!',
          message: `Bem-vindo, ${response.user.profile.firstName}!`,
        });

        // Redirect based on role
        let destination = from === '/' ? '/dashboard' : from;
        if (response.user.role === 'patient') {
          destination = from === '/' ? '/portal/dashboard' : from;
        } else if (response.user.role === 'partner') {
          destination = from === '/' ? '/partner/dashboard' : from;
        }
          
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Falha no login. Verifique suas credenciais.';
      setError('root', { 
        type: 'manual', 
        message: errorMessage 
      });
      addToast({
        type: 'error',
        title: 'Erro no Login',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      addToast({
        type: 'error',
        title: 'Email obrigatório',
        message: 'Por favor, insira seu email para recuperar a senha.',
      });
      return;
    }

    setResetLoading(true);

    try {
      // In a real implementation, this would call the password reset service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      addToast({
        type: 'success',
        title: 'Email enviado!',
        message: 'Instruções para redefinir sua senha foram enviadas para seu email.',
      });
      
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao enviar email',
        message: 'Não foi possível enviar o email de recuperação. Tente novamente.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
            <Mail className="w-12 h-12 text-blue-600 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Recuperar Senha</h1>
            <p className="mt-2 text-sm text-gray-600">
              Digite seu email para receber instruções de recuperação
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="reset-email"
                name="reset-email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center justify-center"
              >
                {resetLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  'Enviar Email'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <Stethoscope className="w-12 h-12 text-blue-600 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Fisio<span className="text-blue-600">Flow</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">Bem-vindo! Faça login para continuar.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.root.message}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Esqueceu a senha?
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Contas de teste</span>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-500 space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Admin:</p>
                <code className="text-blue-600">admin@fisioflow.com</code>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Terapeuta:</p>
                <code className="text-blue-600">therapist@fisioflow.com</code>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Paciente:</p>
                <code className="text-blue-600">patient@fisioflow.com</code>
              </div>
            </div>
            <p className="text-gray-400">Senha para todas: <code>password123</code></p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <ReactRouterDOM.Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Cadastre-se
            </ReactRouterDOM.Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;