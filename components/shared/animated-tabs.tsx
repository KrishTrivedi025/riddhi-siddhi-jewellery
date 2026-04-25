import { motion } from "framer-motion"
import { hoverNudge, tapScale, springSmooth } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface Tab {
    id: string
    label: string
    icon?: React.ReactNode
    count?: number
    activeColorClass?: string // e.g. "bg-primary/10 border-primary/40 text-primary"
}

interface AnimatedTabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (id: string) => void
    layoutIdPrefix: string
}

export function AnimatedTabs({ tabs, activeTab, onChange, layoutIdPrefix }: AnimatedTabsProps) {
    return (
        <div className="flex items-center gap-2 mb-6">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                
                // Extract text color if provided, else use primary
                const textClass = tab.activeColorClass 
                    ? tab.activeColorClass.split(' ').find(c => c.startsWith('text-')) || 'text-primary'
                    : 'text-primary'
                    
                const bgClass = tab.activeColorClass
                    ? tab.activeColorClass.split(' ').find(c => c.startsWith('bg-')) || 'bg-primary/10'
                    : 'bg-primary/10'

                const borderClass = tab.activeColorClass
                    ? tab.activeColorClass.split(' ').find(c => c.startsWith('border-')) || 'border-primary/20'
                    : 'border-primary/20'

                return (
                    <motion.button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        whileHover={hoverNudge}
                        whileTap={tapScale}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 overflow-hidden border",
                            isActive ? "border-transparent" : "border-border",
                            isActive ? textClass : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {/* Active Background Animation */}
                        {isActive && (
                            <motion.span
                                layoutId={`${layoutIdPrefix}-active-bg`}
                                className={cn("absolute inset-0 rounded-xl border", bgClass, borderClass)}
                                transition={springSmooth}
                            />
                        )}

                        {/* Hover Background (Inactive) */}
                        {!isActive && (
                            <motion.span
                                className="absolute inset-0 rounded-xl bg-transparent border border-transparent"
                                whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                                transition={{ duration: 0.15 }}
                            />
                        )}

                        {/* Content */}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                            {tab.count !== undefined && (
                                <span
                                    className={cn(
                                        "ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold",
                                        isActive ? `bg-background/50` : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </motion.button>
                )
            })}
        </div>
    )
}
