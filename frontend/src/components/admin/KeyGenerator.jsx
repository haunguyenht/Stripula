import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  Loader2, 
  Copy, 
  Check, 
  Coins, 
  Crown,
  Calendar,
  Hash,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { spring } from '@/lib/motion';

/**
 * KeyGenerator Component
 * Admin tool for generating redeem keys
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6
 */

const API_BASE = '/api';

const TIER_OPTIONS = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'diamond', label: 'Diamond' },
];

export function KeyGenerator({ onKeysGenerated }) {
  const [type, setType] = useState('credits');
  const [creditAmount, setCreditAmount] = useState('100');
  const [tierValue, setTierValue] = useState('bronze');
  const [quantity, setQuantity] = useState('1');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const { success, error } = useToast();

  /**
   * Generate keys via API
   */
  const handleGenerate = useCallback(async () => {
    // Validate inputs
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      error('Quantity must be between 1 and 100');
      return;
    }

    const uses = parseInt(maxUses, 10);
    if (isNaN(uses) || uses < 1) {
      error('Max uses must be at least 1');
      return;
    }

    if (type === 'credits') {
      const amount = parseInt(creditAmount, 10);
      if (isNaN(amount) || amount < 1) {
        error('Credit amount must be at least 1');
        return;
      }
    }

    setIsLoading(true);
    setGeneratedKeys([]);

    try {
      const payload = {
        type,
        value: type === 'credits' ? parseInt(creditAmount, 10) : tierValue,
        quantity: qty,
        maxUses: uses,
        note: note.trim() || undefined,
      };

      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }

      const response = await fetch(`${API_BASE}/admin/keys/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        setGeneratedKeys(data.keys || []);
        success(`Generated ${data.keys?.length || 0} keys successfully`);
        
        if (onKeysGenerated) {
          onKeysGenerated(data.keys);
        }
      } else {
        error(data.message || 'Failed to generate keys');
      }
    } catch (err) {
      error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [type, creditAmount, tierValue, quantity, maxUses, expiresAt, note, success, error, onKeysGenerated]);

  /**
   * Copy key to clipboard
   */
  const handleCopyKey = useCallback(async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      error('Failed to copy');
    }
  }, [error]);

  /**
   * Copy all keys to clipboard
   */
  const handleCopyAll = useCallback(async () => {
    try {
      const allCodes = generatedKeys.map(k => k.code).join('\n');
      await navigator.clipboard.writeText(allCodes);
      success('All keys copied to clipboard');
    } catch (err) {
      error('Failed to copy');
    }
  }, [generatedKeys, success, error]);

  /**
   * Reset form
   */
  const handleReset = useCallback(() => {
    setGeneratedKeys([]);
    setCreditAmount('100');
    setTierValue('bronze');
    setQuantity('1');
    setMaxUses('1');
    setExpiresAt('');
    setNote('');
  }, []);

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5 text-primary" />
          Generate Redeem Keys
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Key Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credits">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    Credits
                  </div>
                </SelectItem>
                <SelectItem value="tier">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Tier Upgrade
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label>{type === 'credits' ? 'Credit Amount' : 'Tier'}</Label>
            {type === 'credits' ? (
              <Input
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="100"
              />
            ) : (
              <Select value={tierValue} onValueChange={setTierValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Quantity and Max Uses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" />
              Quantity (1-100)
            </Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Max Uses per Key</Label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        {/* Expiration Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Expiration Date (Optional)
          </Label>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label>Note (Optional)</Label>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Giveaway batch #1"
            maxLength={100}
          />
        </div>

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Generate Keys
              </>
            )}
          </Button>
          {generatedKeys.length > 0 && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Generated Keys Display */}
        <AnimatePresence>
          {generatedKeys.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.soft}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Generated {generatedKeys.length} key{generatedKeys.length > 1 ? 's' : ''}
                </Label>
                <Button variant="ghost" size="sm" onClick={handleCopyAll}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy All
                </Button>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-border p-2 bg-muted/30">
                {generatedKeys.map((key, index) => (
                  <motion.div
                    key={key.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md",
                      "bg-background border border-border/50",
                      "hover:border-primary/30 transition-colors"
                    )}
                  >
                    <code className="text-sm font-mono tracking-wider">
                      {key.code}
                    </code>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {key.type === 'credits' ? `${key.value} credits` : key.value}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopyKey(key.code, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default KeyGenerator;
