import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ProxyConfigForm Component
 * Form for configuring proxy settings for a gateway
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 * - Form fields: host, port, type (select), username, password
 * - Password field masked
 * - Validation: host and port required if any field set
 */

const PROXY_TYPES = [
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'socks4', label: 'SOCKS4' },
  { value: 'socks5', label: 'SOCKS5' },
];

export function ProxyConfigForm({ 
  initialConfig = null, 
  onChange,
  disabled = false,
  className 
}) {
  // Form state
  const [host, setHost] = useState(initialConfig?.host || '');
  const [port, setPort] = useState(initialConfig?.port?.toString() || '');
  const [type, setType] = useState(initialConfig?.type || 'http');
  const [username, setUsername] = useState(initialConfig?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});

  // Update form when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setHost(initialConfig.host || '');
      setPort(initialConfig.port?.toString() || '');
      setType(initialConfig.type || 'http');
      setUsername(initialConfig.username || '');
      // Don't set password from initial config (it's masked)
      setPassword('');
    } else {
      // Clear form when config is null
      setHost('');
      setPort('');
      setType('http');
      setUsername('');
      setPassword('');
    }
  }, [initialConfig]);

  /**
   * Validate form fields
   * Requirement 2.3: host and port required if any field set
   */
  const validate = useCallback(() => {
    const newErrors = {};
    const hasAnyField = host || port || username || password;

    if (hasAnyField) {
      if (!host) {
        newErrors.host = 'Host is required when configuring proxy';
      }
      if (!port) {
        newErrors.port = 'Port is required when configuring proxy';
      } else {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          newErrors.port = 'Port must be between 1 and 65535';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [host, port, username, password]);

  /**
   * Get current form values as config object
   */
  const getConfig = useCallback(() => {
    const hasAnyField = host || port || username || password;
    
    if (!hasAnyField) {
      return null;
    }

    return {
      host: host || null,
      port: port ? parseInt(port, 10) : null,
      type: type || 'http',
      username: username || null,
      password: password || null,
    };
  }, [host, port, type, username, password]);

  /**
   * Handle field changes and notify parent
   */
  const handleChange = useCallback((field, value) => {
    switch (field) {
      case 'host':
        setHost(value);
        break;
      case 'port':
        setPort(value);
        break;
      case 'type':
        setType(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      const config = getConfig();
      const isValid = validate();
      onChange({ config, isValid, validate });
    }
  }, [host, port, type, username, password, onChange, getConfig, validate]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Host and Port Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Host */}
        <div className="space-y-1.5">
          <Label htmlFor="proxy-host" className="text-sm">
            Host
          </Label>
          <Input
            id="proxy-host"
            placeholder="proxy.example.com"
            value={host}
            onChange={(e) => handleChange('host', e.target.value)}
            disabled={disabled}
            className={cn(errors.host && "border-red-500 focus-visible:border-red-500")}
          />
          {errors.host && (
            <p className="text-xs text-red-500">{errors.host}</p>
          )}
        </div>

        {/* Port */}
        <div className="space-y-1.5">
          <Label htmlFor="proxy-port" className="text-sm">
            Port
          </Label>
          <Input
            id="proxy-port"
            type="number"
            placeholder="8080"
            min="1"
            max="65535"
            value={port}
            onChange={(e) => handleChange('port', e.target.value)}
            disabled={disabled}
            className={cn(errors.port && "border-red-500 focus-visible:border-red-500")}
          />
          {errors.port && (
            <p className="text-xs text-red-500">{errors.port}</p>
          )}
        </div>
      </div>

      {/* Proxy Type */}
      <div className="space-y-1.5">
        <Label htmlFor="proxy-type" className="text-sm">
          Type
        </Label>
        <Select
          value={type}
          onValueChange={(value) => handleChange('type', value)}
          disabled={disabled}
        >
          <SelectTrigger id="proxy-type">
            <SelectValue placeholder="Select proxy type" />
          </SelectTrigger>
          <SelectContent>
            {PROXY_TYPES.map((proxyType) => (
              <SelectItem key={proxyType.value} value={proxyType.value}>
                {proxyType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Username and Password Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="proxy-username" className="text-sm">
            Username <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="proxy-username"
            placeholder="username"
            value={username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={disabled}
            autoComplete="off"
          />
        </div>

        {/* Password - Requirement 2.5: masked */}
        <div className="space-y-1.5">
          <Label htmlFor="proxy-password" className="text-sm">
            Password <span className="text-muted-foreground">(optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="proxy-password"
              type={showPassword ? 'text' : 'password'}
              placeholder={initialConfig?.password ? '••••••••' : 'password'}
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={disabled}
              autoComplete="new-password"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Leave all fields empty to use direct connection without proxy.
      </p>
    </div>
  );
}

export default ProxyConfigForm;
