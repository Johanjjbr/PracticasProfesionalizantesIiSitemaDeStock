import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Package, Check, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';

type PasswordMode = 'create' | 'reset';

export default function CreatePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as PasswordMode) || 'create';

  // Estados para crear contraseña
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para restablecer contraseña
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [codeInput, setCodeInput] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [codeSent, setCodeSent] = useState(false);

  // Validaciones de contraseña
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Calcular fortaleza de contraseña
  const getPasswordStrength = () => {
    let strength = 0;
    if (hasMinLength) strength += 25;
    if (hasUpperCase) strength += 25;
    if (hasNumber) strength += 25;
    if (hasSpecialChar) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const getStrengthLabel = () => {
    if (passwordStrength === 0) return 'Muy débil';
    if (passwordStrength <= 25) return 'Débil';
    if (passwordStrength <= 50) return 'Media';
    if (passwordStrength <= 75) return 'Fuerte';
    return 'Muy fuerte';
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-destructive';
    if (passwordStrength <= 50) return 'bg-warning';
    if (passwordStrength <= 75) return 'bg-primary';
    return 'bg-success';
  };

  // Handlers para crear contraseña
  const handleCreatePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      toast.error('La contraseña no cumple todos los requisitos');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    toast.success('Contraseña creada exitosamente', {
      description: 'Ya puedes iniciar sesión con tu nueva contraseña',
    });

    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  // Handlers para restablecer contraseña
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Por favor ingrese un email válido');
      return;
    }

    // Simular envío de código
    setCodeSent(true);
    setStep('code');
    toast.success('Código de verificación enviado', {
      description: `Revisa tu email: ${email}`,
    });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();

    if (codeInput.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    // Simular verificación (código demo: 123456)
    if (codeInput === '123456') {
      setStep('password');
      toast.success('Código verificado correctamente');
    } else {
      toast.error('Código incorrecto', {
        description: 'Código de prueba: 123456',
      });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      toast.error('La contraseña no cumple todos los requisitos');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    toast.success('Contraseña restablecida exitosamente', {
      description: 'Ya puedes iniciar sesión con tu nueva contraseña',
    });

    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  const handleCodeInputChange = (value: string) => {
    // Solo permitir números y máximo 6 dígitos
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCodeInput(numericValue);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-foreground">
            {mode === 'create' ? 'Crear Nueva Contraseña' : 'Restablecer Contraseña'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create'
              ? 'Define tu contraseña de acceso al sistema'
              : 'Recupera el acceso a tu cuenta'
            }
          </p>
        </div>

        {/* Botón volver */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/login')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Login
        </Button>

        {/* MODO: CREAR CONTRASEÑA */}
        {mode === 'create' && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            {/* Nueva Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña *</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input-background"
              />
            </div>

            {/* Indicador de Fortaleza */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fortaleza:</span>
                  <span className={cn(
                    "font-medium",
                    passwordStrength <= 25 && "text-destructive",
                    passwordStrength > 25 && passwordStrength <= 50 && "text-warning",
                    passwordStrength > 50 && passwordStrength <= 75 && "text-primary",
                    passwordStrength > 75 && "text-success"
                  )}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-2" />
              </div>
            )}

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input-background"
              />
            </div>

            {/* Mostrar contraseña */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="showPassword" className="text-sm cursor-pointer">
                Mostrar contraseña
              </Label>
            </div>

            {/* Requisitos */}
            <div className="space-y-2 p-4 bg-accent rounded-md">
              <p className="text-sm font-medium">Requisitos de la contraseña:</p>
              <ul className="space-y-1.5 text-sm">
                <li className={cn(
                  "flex items-center gap-2",
                  hasMinLength ? "text-success" : "text-muted-foreground"
                )}>
                  {hasMinLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Mínimo 8 caracteres
                </li>
                <li className={cn(
                  "flex items-center gap-2",
                  hasUpperCase ? "text-success" : "text-muted-foreground"
                )}>
                  {hasUpperCase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Al menos 1 letra mayúscula
                </li>
                <li className={cn(
                  "flex items-center gap-2",
                  hasNumber ? "text-success" : "text-muted-foreground"
                )}>
                  {hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Al menos 1 número
                </li>
                <li className={cn(
                  "flex items-center gap-2",
                  hasSpecialChar ? "text-success" : "text-muted-foreground"
                )}>
                  {hasSpecialChar ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Al menos 1 carácter especial (!@#$%^&*)
                </li>
                <li className={cn(
                  "flex items-center gap-2",
                  passwordsMatch ? "text-success" : "text-muted-foreground"
                )}>
                  {passwordsMatch ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Las contraseñas coinciden
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar || !passwordsMatch}
            >
              Crear Contraseña
            </Button>
          </form>
        )}

        {/* MODO: RESTABLECER CONTRASEÑA */}
        {mode === 'reset' && (
          <div className="space-y-6">
            {/* PASO 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Paso 1: Verificación de Email</p>
                  <p className="text-xs text-muted-foreground">
                    Ingresa tu email registrado para recibir el código de verificación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Registrado *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input-background"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Enviar Código de Verificación
                </Button>
              </form>
            )}

            {/* PASO 2: Código de Verificación */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Paso 2: Código de Verificación</p>
                  <p className="text-xs text-muted-foreground">
                    Ingresa el código de 6 dígitos enviado a: <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código de Verificación *</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    value={codeInput}
                    onChange={(e) => handleCodeInputChange(e.target.value)}
                    className="bg-input-background text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Código de prueba: 123456
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('email')}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button type="submit" className="flex-1">
                    Verificar Código
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSendCode}
                  className="w-full"
                >
                  Reenviar código
                </Button>
              </form>
            )}

            {/* PASO 3: Nueva Contraseña */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Paso 3: Nueva Contraseña</p>
                  <p className="text-xs text-muted-foreground">
                    Define tu nueva contraseña de acceso
                  </p>
                </div>

                {/* Nueva Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña *</Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input-background"
                  />
                </div>

                {/* Indicador de Fortaleza */}
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Fortaleza:</span>
                      <span className={cn(
                        "font-medium",
                        passwordStrength <= 25 && "text-destructive",
                        passwordStrength > 25 && passwordStrength <= 50 && "text-warning",
                        passwordStrength > 50 && passwordStrength <= 75 && "text-primary",
                        passwordStrength > 75 && "text-success"
                      )}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className="h-2" />
                  </div>
                )}

                {/* Confirmar Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input-background"
                  />
                </div>

                {/* Mostrar contraseña */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="showPassword" className="text-sm cursor-pointer">
                    Mostrar contraseña
                  </Label>
                </div>

                {/* Requisitos */}
                <div className="space-y-2 p-4 bg-accent rounded-md">
                  <p className="text-sm font-medium">Requisitos:</p>
                  <ul className="space-y-1.5 text-sm">
                    <li className={cn(
                      "flex items-center gap-2",
                      hasMinLength ? "text-success" : "text-muted-foreground"
                    )}>
                      {hasMinLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      Mínimo 8 caracteres
                    </li>
                    <li className={cn(
                      "flex items-center gap-2",
                      hasUpperCase ? "text-success" : "text-muted-foreground"
                    )}>
                      {hasUpperCase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      Al menos 1 letra mayúscula
                    </li>
                    <li className={cn(
                      "flex items-center gap-2",
                      hasNumber ? "text-success" : "text-muted-foreground"
                    )}>
                      {hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      Al menos 1 número
                    </li>
                    <li className={cn(
                      "flex items-center gap-2",
                      hasSpecialChar ? "text-success" : "text-muted-foreground"
                    )}>
                      {hasSpecialChar ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      Al menos 1 carácter especial
                    </li>
                    <li className={cn(
                      "flex items-center gap-2",
                      passwordsMatch ? "text-success" : "text-muted-foreground"
                    )}>
                      {passwordsMatch ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      Las contraseñas coinciden
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('code')}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar || !passwordsMatch}
                  >
                    Restablecer Contraseña
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            {mode === 'create'
              ? 'Una vez creada tu contraseña, podrás acceder al sistema'
              : 'Si tienes problemas, contacta al administrador del sistema'
            }
          </p>
        </div>
      </Card>
    </div>
  );
}
