import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Animation configuration for the rotating title text
const TITLE_ROTATION_INTERVAL_MS = 2000;
const TITLE_SLIDE_OFFSET_PX = 150;
const SPRING_STIFFNESS = 50;

function AnimatedHero({ onGetStarted }) {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["instant", "secure", "transparent", "effortless", "powerful"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full">
            <div className="container mx-auto">
                <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
                    <div>
                        <Button variant="secondary" size="sm" className="gap-4">
                            Built on Stacks <MoveRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex gap-4 flex-col">
                        <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
                            <span className="text-slate-900">Send tips that are</span>
                            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute font-semibold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent"
                                        initial={{ opacity: 0, y: "-100" }}
                                        transition={{ type: "spring", stiffness: 50 }}
                                        animate={
                                            titleNumber === index
                                                ? {
                                                    y: 0,
                                                    opacity: 1,
                                                }
                                                : {
                                                    y: titleNumber > index ? -150 : 150,
                                                    opacity: 0,
                                                }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl leading-relaxed tracking-tight text-slate-500 max-w-2xl text-center">
                            TipStream is the fastest way to send STX tips to your favorite creators on the Stacks blockchain. Secured by Bitcoin, powered by transparency.
                        </p>
                    </div>
                    <div className="flex flex-row gap-3">
                        <Button
                            size="lg"
                            className="gap-4 bg-slate-900 hover:bg-slate-800 text-white shadow-2xl hover:shadow-slate-200 transition-all transform hover:-translate-y-1 active:scale-95"
                            onClick={onGetStarted}
                        >
                            Get Started Now <Zap className="w-4 h-4" />
                        </Button>
                        <Button size="lg" className="gap-4" variant="outline">
                            Learn More <MoveRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { AnimatedHero };
