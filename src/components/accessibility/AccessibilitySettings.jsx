import React from 'react';
import { Sun, Moon, Type, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { speak } from '../voice/VoiceController';

export default function AccessibilitySettings({
    settings,
    onSettingsChange
}) {
    const { highContrast, fontSize, voiceEnabled } = settings;

    const handleContrastToggle = () => {
        const newValue = !highContrast;
        onSettingsChange({ ...settings, highContrast: newValue });
        if (voiceEnabled) {
            speak(newValue ? 'High contrast mode enabled' : 'High contrast mode disabled');
        }
    };

    const handleFontSizeChange = (value) => {
        onSettingsChange({ ...settings, fontSize: value[0] });
    };

    const handleVoiceToggle = () => {
        const newValue = !voiceEnabled;
        onSettingsChange({ ...settings, voiceEnabled: newValue });
        if (newValue) {
            speak('Voice feedback enabled');
        }
    };

    const fontSizeLabel = fontSize <= 16 ? 'Normal' : fontSize <= 20 ? 'Large' : 'Extra Large';

    return (
        <Card
            className="border-2"
            role="region"
            aria-labelledby="accessibility-settings-title"
        >
            <CardHeader className="pb-4" >
                <CardTitle
                    id="accessibility-settings-title"
                    className="text-xl flex items-center gap-2"
                >
                    <Type className="h-5 w-5" aria-hidden="true" />
                    Accessibility Settings
                </CardTitle>
            </CardHeader>
            < CardContent className="space-y-6" >
                {/* High Contrast Toggle */}
                < div className="flex items-center justify-between gap-4" >
                    <div className="flex items-center gap-3" >
                        {
                            highContrast ? (
                                <Moon className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Sun className="h-5 w-5" aria-hidden="true" />
                            )
                        }
                        <Label
                            htmlFor="contrast-toggle"
                            className="text-base font-medium cursor-pointer"
                        >
                            High Contrast Mode
                        </Label>
                    </div>
                    < Switch
                        id="contrast-toggle"
                        checked={highContrast}
                        onCheckedChange={handleContrastToggle}
                        aria-describedby="contrast-description"
                    />
                </div>
                < p id="contrast-description" className="text-sm text-muted-foreground -mt-2 ml-8" >
                    Increases color contrast for better visibility
                </p>

                {/* Font Size Slider */}
                < div className="space-y-3" >
                    <div className="flex items-center justify-between" >
                        <Label htmlFor="font-size-slider" className="text-base font-medium" >
                            Text Size: {fontSizeLabel}
                        </Label>
                        < span className="text-sm text-muted-foreground" > {fontSize}px </span>
                    </div>
                    < Slider
                        id="font-size-slider"
                        value={[fontSize]}
                        onValueChange={handleFontSizeChange}
                        min={14}
                        max={24}
                        step={2}
                        className="w-full"
                        aria-label={`Text size slider, currently ${fontSizeLabel}`}
                        aria-valuemin={14}
                        aria-valuemax={24}
                        aria-valuenow={fontSize}
                    />
                    < div className="flex justify-between text-xs text-muted-foreground" >
                        <span>Smaller </span>
                        < span > Larger </span>
                    </div>
                </div>

                {/* Voice Feedback Toggle */}
                <div className="flex items-center justify-between gap-4" >
                    <div className="flex items-center gap-3" >
                        {
                            voiceEnabled ? (
                                <Volume2 className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <VolumeX className="h-5 w-5" aria-hidden="true" />
                            )}
                        <Label
                            htmlFor="voice-toggle"
                            className="text-base font-medium cursor-pointer"
                        >
                            Voice Feedback
                        </Label>
                    </div>
                    < Switch
                        id="voice-toggle"
                        checked={voiceEnabled}
                        onCheckedChange={handleVoiceToggle}
                        aria-describedby="voice-description"
                    />
                </div>
                < p id="voice-description" className="text-sm text-muted-foreground -mt-2 ml-8" >
                    Reads actions and content aloud
                </p>
            </CardContent>
        </Card>
    );
}