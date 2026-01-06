import { motion } from 'motion/react';
import { Shield, User, CreditCard, Loader2, Lock, Fingerprint, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PageLoader - Premium Full-Page Loading States
 * 
 * PROFILE VARIANT:
 * Light: Vintage portrait frame with copper accents, aged parchment
 * Dark: Aurora glass portrait with prismatic ring effects
 * 
 * ADMIN VARIANT (Verify Access):
 * Light: Treasury vault door with brass mechanisms
 * Dark: Cybersecurity terminal with scanning effects
 */

// ============================================
// PROFILE LOADER - Portrait Frame Style
// ============================================
function ProfileLoader({ label }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Portrait frame container */}
      <div className="relative">
        {/* Outer decorative frame - Light mode */}
        <div 
          className={cn(
            "absolute -inset-4 rounded-3xl pointer-events-none",
            // Light: Vintage gilt frame
            "bg-gradient-to-b from-[hsl(35,50%,85%)] via-[hsl(30,45%,80%)] to-[hsl(35,50%,85%)]",
            "border-2 border-[hsl(30,40%,70%)]",
            "shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(101,67,33,0.2),0_8px_32px_rgba(101,67,33,0.15)]",
            // Dark: Aurora glass frame
            "dark:bg-none dark:bg-[rgba(139,92,246,0.08)]",
            "dark:border dark:border-[rgba(139,92,246,0.2)]",
            "dark:shadow-[0_0_60px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]"
          )}
        >
          {/* Corner ornaments - light mode */}
          <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-[hsl(25,55%,50%)]/50 rounded-tl-sm dark:hidden" />
          <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-[hsl(25,55%,50%)]/50 rounded-tr-sm dark:hidden" />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-[hsl(25,55%,50%)]/50 rounded-bl-sm dark:hidden" />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-[hsl(25,55%,50%)]/50 rounded-br-sm dark:hidden" />
        </div>
        
        {/* Pulsing aurora ring - dark mode */}
        <motion.div
          className="absolute -inset-6 rounded-full hidden dark:block pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(34,211,238,0.1) 50%, transparent 70%)'
          }}
        />
        
        {/* Main portrait circle */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden",
            // Light: Aged parchment with copper border
            "bg-gradient-to-br from-[hsl(40,45%,96%)] via-[hsl(38,40%,93%)] to-[hsl(35,35%,90%)]",
            "border-[3px] border-[hsl(28,60%,55%)]",
            "shadow-[inset_0_4px_12px_rgba(101,67,33,0.1),0_4px_20px_rgba(101,67,33,0.2)]",
            // Dark: Aurora glass
            "dark:bg-none dark:bg-gradient-to-br dark:from-[rgba(139,92,246,0.15)] dark:via-[rgba(99,102,241,0.1)] dark:to-[rgba(34,211,238,0.1)]",
            "dark:border-2 dark:border-[rgba(139,92,246,0.3)]",
            "dark:shadow-[0_0_40px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
          )}
        >
          {/* Paper texture - light mode */}
          <div 
            className="absolute inset-0 opacity-[0.04] dark:hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-10 h-10 text-[hsl(25,40%,45%)] dark:text-white/60" />
          </div>
          
          {/* Rotating ring overlay */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="profile-ring-light" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(28,70%,55%)" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="hsl(35,65%,60%)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(28,70%,55%)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="profile-ring-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="33%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="66%" stopColor="#ec4899" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                className="stroke-[url(#profile-ring-light)] dark:stroke-[url(#profile-ring-dark)]"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60 230"
              />
            </svg>
          </motion.div>
        </motion.div>
        
        {/* Floating particles - dark mode */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full hidden dark:block"
            style={{
              background: i % 2 === 0 ? '#8b5cf6' : '#22d3ee',
              boxShadow: `0 0 8px ${i % 2 === 0 ? '#8b5cf6' : '#22d3ee'}`,
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos(i * 90 * Math.PI / 180) * 50],
              y: [0, Math.sin(i * 90 * Math.PI / 180) * 50],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
      
      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.p
          className={cn(
            "text-sm font-semibold tracking-wide",
            // Light: Embossed copper text
            "text-[hsl(25,35%,40%)]",
            "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]",
            // Dark: Aurora gradient text
            "dark:text-transparent dark:bg-clip-text",
            "dark:bg-gradient-to-r dark:from-violet-400 dark:via-cyan-300 dark:to-violet-400",
            "dark:[text-shadow:none]"
          )}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.p>
        
        {/* Loading dots */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                "bg-[hsl(28,55%,50%)] dark:bg-violet-400"
              )}
              animate={{ 
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// ADMIN LOADER - Vault/Security Terminal Style
// ============================================
function AdminLoader({ label }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Security vault container */}
      <div className="relative">
        {/* Scanning beam effect - dark mode */}
        <motion.div
          className="absolute -inset-8 hidden dark:block pointer-events-none overflow-hidden rounded-2xl"
          style={{ perspective: '500px' }}
        >
          <motion.div
            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            style={{ boxShadow: '0 0 20px rgba(34,211,238,0.5)' }}
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        
        {/* Outer vault door frame */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative w-28 h-28 rounded-2xl overflow-hidden",
            // Light: Brass vault door
            "bg-gradient-to-br from-[hsl(38,40%,88%)] via-[hsl(35,35%,82%)] to-[hsl(32,30%,78%)]",
            "border-2 border-[hsl(30,35%,65%)]",
            "shadow-[inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(101,67,33,0.15),0_8px_32px_rgba(101,67,33,0.2)]",
            // Dark: Cybersec terminal
            "dark:bg-none dark:bg-[rgba(15,23,42,0.95)]",
            "dark:border dark:border-cyan-500/30",
            "dark:shadow-[0_0_40px_rgba(34,211,238,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
          )}
        >
          {/* Vault texture - light mode */}
          <div 
            className="absolute inset-0 opacity-[0.05] dark:hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Grid pattern - dark mode */}
          <div 
            className="absolute inset-0 hidden dark:block opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)`,
              backgroundSize: '8px 8px'
            }}
          />
          
          {/* Inner dial/lock mechanism */}
          <div className="absolute inset-3 flex items-center justify-center">
            {/* Rotating dial - light mode */}
            <motion.div
              className={cn(
                "absolute w-16 h-16 rounded-full",
                // Light: Brass dial
                "bg-gradient-to-br from-[hsl(35,50%,75%)] via-[hsl(30,45%,65%)] to-[hsl(28,40%,55%)]",
                "border-2 border-[hsl(28,50%,50%)]",
                "shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(101,67,33,0.2),0_2px_8px_rgba(101,67,33,0.15)]",
                // Dark: Holographic ring
                "dark:bg-none dark:bg-transparent dark:border-0 dark:shadow-none"
              )}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              {/* Dial notches - light mode */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-2 bg-[hsl(25,40%,40%)] dark:hidden"
                  style={{
                    left: '50%',
                    top: '2px',
                    marginLeft: '-1px',
                    transformOrigin: 'center 30px',
                    transform: `rotate(${i * 30}deg)`
                  }}
                />
              ))}
            </motion.div>
            
            {/* Holographic scan ring - dark mode */}
            <motion.div
              className="absolute w-20 h-20 rounded-full hidden dark:block"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="scan-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#scan-ring)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="20 50 40 50"
                />
              </svg>
            </motion.div>
            
            {/* Center icon */}
            <motion.div
              className={cn(
                "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center",
                // Light: Copper seal
                "bg-gradient-to-br from-[hsl(28,60%,50%)] to-[hsl(25,55%,40%)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_rgba(101,67,33,0.3)]",
                // Dark: Glowing terminal
                "dark:bg-none dark:bg-cyan-500/10",
                "dark:border dark:border-cyan-400/40",
                "dark:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              )}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-5 h-5 text-white/90 dark:text-cyan-400" />
            </motion.div>
          </div>
          
          {/* Corner bolts - light mode */}
          {[
            'top-2 left-2',
            'top-2 right-2',
            'bottom-2 left-2',
            'bottom-2 right-2'
          ].map((pos, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full dark:hidden",
                "bg-gradient-to-br from-[hsl(30,40%,60%)] to-[hsl(28,35%,50%)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
                pos
              )}
            />
          ))}
          
          {/* Status indicators - dark mode */}
          <div className="absolute top-2 right-2 hidden dark:flex flex-col gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-cyan-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
                style={{ boxShadow: '0 0 4px rgba(34,211,238,0.8)' }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Lock icon floating - light mode */}
        <motion.div
          className="absolute -top-2 -right-2 dark:hidden"
          animate={{ y: [0, -3, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br from-[hsl(28,65%,55%)] to-[hsl(25,60%,45%)]",
            "border border-[hsl(28,50%,50%)]",
            "shadow-[0_2px_8px_rgba(166,100,50,0.4)]"
          )}>
            <Lock className="w-3 h-3 text-white" />
          </div>
        </motion.div>
        
        {/* Fingerprint scan icon - dark mode */}
        <motion.div
          className="absolute -top-3 -right-3 hidden dark:block"
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            "bg-violet-500/20 border border-violet-400/40",
            "shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          )}>
            <Fingerprint className="w-4 h-4 text-violet-400" />
          </div>
        </motion.div>
      </div>
      
      {/* Label with security aesthetic */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        {/* Terminal-style text - dark mode */}
        <div className="hidden dark:block">
          <motion.div
            className="font-mono text-xs text-cyan-400/80 mb-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {'>'} AUTHENTICATING...
          </motion.div>
          <p className="text-sm font-medium text-white/70">{label}</p>
        </div>
        
        {/* Vintage text - light mode */}
        <div className="dark:hidden">
          <motion.p
            className={cn(
              "text-sm font-semibold tracking-wide",
              "text-[hsl(25,35%,35%)]",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.5)]"
            )}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {label}
          </motion.p>
        </div>
        
        {/* Progress bar */}
        <div className={cn(
          "mt-3 w-32 h-1 rounded-full overflow-hidden",
          "bg-[hsl(35,30%,85%)] dark:bg-white/10"
        )}>
          <motion.div
            className={cn(
              "h-full rounded-full",
              "bg-gradient-to-r from-[hsl(28,60%,50%)] to-[hsl(35,55%,55%)]",
              "dark:from-cyan-500 dark:to-violet-500"
            )}
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '100%', '0%'] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// VARIANT CONFIG
// ============================================
const variantConfig = {
  default: {
    label: 'Loading',
  },
  profile: {
    label: 'Loading Profile',
  },
  admin: {
    label: 'Verifying Access',
  },
  auth: {
    label: 'Authenticating',
  },
  cards: {
    label: 'Loading',
  },
};

// ============================================
// MAIN PAGE LOADER COMPONENT
// ============================================
export function PageLoader({ 
  variant = 'default',
  label,
  className,
}) {
  const config = variantConfig[variant] || variantConfig.default;
  const displayLabel = label || config.label;

  return (
    <div 
      className={cn(
        "flex items-center justify-center h-full min-h-[300px]",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {variant === 'profile' && <ProfileLoader label={displayLabel} />}
        {variant === 'admin' && <AdminLoader label={displayLabel} />}
        {variant === 'auth' && <AdminLoader label={displayLabel} />}
        
        {/* Default/cards use simplified loader */}
        {(variant === 'default' || variant === 'cards') && (
          <DefaultLoader label={displayLabel} variant={variant} />
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// DEFAULT LOADER - Simple elegant version
// ============================================
function DefaultLoader({ label, variant }) {
  const Icon = variant === 'cards' ? CreditCard : Loader2;
  
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        {/* Rotating ring */}
        <motion.div
          className={cn(
            "w-16 h-16 rounded-full",
            "border-2 border-[hsl(35,30%,85%)] dark:border-white/10"
          )}
        />
        <motion.div
          className="absolute inset-0 w-16 h-16 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <defs>
              <linearGradient id="default-ring-light" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(28,60%,50%)" />
                <stop offset="100%" stopColor="hsl(35,55%,55%)" />
              </linearGradient>
              <linearGradient id="default-ring-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              className="stroke-[url(#default-ring-light)] dark:stroke-[url(#default-ring-dark)]"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="50 130"
            />
          </svg>
        </motion.div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-6 h-6 text-[hsl(25,35%,45%)] dark:text-white/50" />
        </div>
      </div>
      
      {/* Label */}
      <motion.p
        className={cn(
          "text-sm font-medium",
          "text-[hsl(25,25%,45%)] dark:text-white/60"
        )}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.p>
    </div>
  );
}

export default PageLoader;
