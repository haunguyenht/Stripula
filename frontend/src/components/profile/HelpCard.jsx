import { motion } from 'motion/react';
import { MessageCircle, ArrowUpRight, Headphones, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * HelpCard Component
 * 
 * VINTAGE BANKING REDESIGN: Telegram contact card with 
 * aged ink blue paper, copper foil accents, and treasury styling.
 */
export function HelpCard({ className, telegramHandle = 'kennjkute' }) {
  const telegramUrl = `https://t.me/${telegramHandle}`;

  return (
    <motion.a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group block relative overflow-hidden rounded-2xl cursor-pointer",
        "transition-all duration-400 ease-out",
        // Light mode - Aged ink blue paper with certificate border
        "bg-gradient-to-b from-[hsl(205,35%,97%)] via-[hsl(210,30%,96%)] to-[hsl(200,25%,94%)]",
        "border border-[hsl(210,25%,78%)]",
        "shadow-[0_8px_30px_hsl(210,35%,35%,0.1),inset_0_0_0_1px_hsl(210,25%,90%),inset_0_0_0_3px_hsl(210,30%,97%),inset_0_0_0_4px_hsl(210,25%,82%)]",
        "hover:shadow-[0_12px_40px_hsl(210,40%,35%,0.15),inset_0_0_0_1px_hsl(210,25%,88%),inset_0_0_0_3px_hsl(210,30%,97%),inset_0_0_0_4px_hsl(210,30%,75%)]",
        "hover:border-[hsl(210,35%,70%)]",
        // Dark mode (reset gradient first)
        "dark:bg-none dark:bg-zinc-900/80 dark:backdrop-blur-xl",
        "dark:border-white/[0.08]",
        "dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
        "dark:hover:border-blue-400/25",
        "dark:hover:shadow-[0_16px_50px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.08)]",
        className
      )}
    >
      {/* Top edge highlight (dark only) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent opacity-0 dark:opacity-100" />
      
      {/* Paper grain (light only) */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-0 pointer-events-none"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px'
        }}
      />
      

      
      {/* Decorative gradient blob - aged ink blue for light, animates on hover */}
      <motion.div 
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[50px] opacity-15 dark:opacity-40 bg-gradient-to-br from-[hsl(210,50%,55%)] to-[hsl(200,45%,50%)] dark:from-blue-400 dark:to-sky-400"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="relative p-5">
        <div className="flex items-center gap-4">
          {/* Icon container - ink blue wax seal style */}
          <motion.div 
            className={cn(
              "relative flex items-center justify-center w-14 h-14 rounded-xl",
              // Light: aged ink blue gradient with wax seal depth
              "bg-gradient-to-br from-[hsl(210,55%,50%)] via-[hsl(205,60%,48%)] to-[hsl(200,55%,45%)]",
              "shadow-[0_6px_20px_hsl(210,50%,40%,0.35),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.15)]",
              "border border-[hsl(210,45%,55%)]",
              // Dark mode
              "dark:from-blue-500 dark:to-sky-500",
              "dark:shadow-lg dark:shadow-blue-500/30 dark:border-white/20"
            )}
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            {/* Glow layer */}
            <div className="absolute inset-0 rounded-xl blur-md opacity-40 dark:opacity-50 bg-gradient-to-br from-[hsl(210,50%,55%)] to-[hsl(200,50%,50%)] dark:from-blue-400 dark:to-sky-400" />
            <Send className="relative w-6 h-6 text-white" />
          </motion.div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-lg font-bold font-serif flex items-center gap-2 mb-0.5",
              "text-[hsl(25,40%,22%)] dark:text-white",
              "[text-shadow:0_1px_0_rgba(255,255,255,0.6)] dark:[text-shadow:none]"
            )}>
              Need Help?
              <Headphones className="w-4 h-4 text-[hsl(210,50%,45%)] dark:text-blue-400" />
            </h3>
            <p className="text-sm text-[hsl(25,25%,45%)] dark:text-white/60">
              Chat with <span className="font-semibold text-[hsl(210,50%,40%)] dark:text-blue-400">@{telegramHandle}</span>
            </p>
          </div>
          
          {/* Arrow indicator - copper coin style */}
          <motion.div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              // Light: copper coin
              "bg-gradient-to-b from-[hsl(40,45%,97%)] to-[hsl(38,40%,94%)]",
              "border border-[hsl(30,25%,80%)]",
              "shadow-[0_2px_4px_hsl(25,30%,30%,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]",
              // Dark mode (reset gradient)
              "dark:bg-none dark:bg-white/[0.08] dark:border-white/[0.1] dark:shadow-none",
              // Hover
              "group-hover:bg-[hsl(210,40%,95%)] dark:group-hover:bg-blue-500/15",
              "group-hover:border-[hsl(210,35%,75%)] dark:group-hover:border-blue-400/25",
              "transition-all duration-300"
            )}
            animate={{ x: [0, 0] }}
            whileHover={{ x: 3 }}
          >
            <ArrowUpRight className={cn(
              "w-4 h-4 transition-colors duration-300",
              "text-[hsl(25,30%,50%)] dark:text-white/50",
              "group-hover:text-[hsl(210,50%,45%)] dark:group-hover:text-blue-400"
            )} />
          </motion.div>
        </div>
        
        {/* Bottom info section */}
        <motion.div 
          className={cn(
            "mt-4 pt-3 border-t",
            "border-[hsl(210,25%,85%)] dark:border-white/[0.06]"
          )}
          initial={{ opacity: 0.7 }}
          whileHover={{ opacity: 1 }}
        >
          <p className="text-xs text-[hsl(25,25%,45%)] dark:text-white/50 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(150,50%,45%)] dark:bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(150,55%,40%)] dark:bg-emerald-500" />
            </span>
            Usually responds within a few hours
          </p>
        </motion.div>
      </div>
    </motion.a>
  );
}

export default HelpCard;
