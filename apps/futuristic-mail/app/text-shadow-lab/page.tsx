'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import chroma from 'chroma-js';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

type ShadowPreset = {
  name: string;
  description: string;
  generateShadow: (color: string) => string;
};

const googleFonts = [
  // Sans-serif fonts
  { name: 'Inter', value: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', value: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', value: 'Lato', category: 'sans-serif' },
  { name: 'Poppins', value: 'Poppins', category: 'sans-serif' },
  { name: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
  { name: 'Raleway', value: 'Raleway', category: 'sans-serif' },
  { name: 'Nunito', value: 'Nunito', category: 'sans-serif' },
  { name: 'Work Sans', value: 'Work Sans', category: 'sans-serif' },
  { name: 'Rubik', value: 'Rubik', category: 'sans-serif' },
  { name: 'DM Sans', value: 'DM Sans', category: 'sans-serif' },
  { name: 'Manrope', value: 'Manrope', category: 'sans-serif' },
  
  // Serif fonts
  { name: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', value: 'Merriweather', category: 'serif' },
  { name: 'Lora', value: 'Lora', category: 'serif' },
  { name: 'Crimson Text', value: 'Crimson Text', category: 'serif' },
  { name: 'Cormorant', value: 'Cormorant', category: 'serif' },
  { name: 'Bitter', value: 'Bitter', category: 'serif' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville', category: 'serif' },
  { name: 'EB Garamond', value: 'EB Garamond', category: 'serif' },
  
  // Display fonts
  { name: 'Bebas Neue', value: 'Bebas Neue', category: 'display' },
  { name: 'Righteous', value: 'Righteous', category: 'display' },
  { name: 'Alfa Slab One', value: 'Alfa Slab One', category: 'display' },
  { name: 'Bungee', value: 'Bungee', category: 'display' },
  { name: 'Fredoka', value: 'Fredoka', category: 'display' },
  { name: 'Pacifico', value: 'Pacifico', category: 'display' },
  { name: 'Lobster', value: 'Lobster', category: 'display' },
  { name: 'Dancing Script', value: 'Dancing Script', category: 'display' },
  { name: 'Permanent Marker', value: 'Permanent Marker', category: 'display' },
  { name: 'Bangers', value: 'Bangers', category: 'display' },
  
  // Monospace fonts
  { name: 'Proto Mono', value: 'Proto Mono', category: 'monospace' },
  { name: 'Fira Code', value: 'Fira Code', category: 'monospace' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono', category: 'monospace' },
  { name: 'Source Code Pro', value: 'Source Code Pro', category: 'monospace' },
  { name: 'IBM Plex Mono', value: 'IBM Plex Mono', category: 'monospace' },
  { name: 'Space Mono', value: 'Space Mono', category: 'monospace' },
  { name: 'Roboto Mono', value: 'Roboto Mono', category: 'monospace' },
  { name: 'Inconsolata', value: 'Inconsolata', category: 'monospace' },
];

const fontWeights = [
  { label: 'Thin', value: 100 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Black', value: 900 },
];

const shadowPresets: ShadowPreset[] = {
  glow: {
    name: 'Glow Effect',
    description: 'Soft ambient glow around text',
    generateShadow: (color: string) => {
      const c = chroma(color);
      const darker = c.darken(0.5).alpha(0.5).css();
      const base = c.alpha(0.5).css();
      const lighter = c.brighten(0.3).alpha(0.6).css();
      const glow = c.alpha(0.9).css();
      const spread = c.alpha(0.6).css();
      
      return `${darker} 0px 4px 4px, ${base} 0px 0px 2px, ${lighter} 0px 0px 4px, ${glow} 0px 0px 10px, ${spread} -1px 8px 13px`;
    }
  },
  neon: {
    name: 'Neon Sign',
    description: 'Bright neon-like effect',
    generateShadow: (color: string) => {
      const c = chroma(color);
      const bright = c.brighten(0.5).css();
      const glow1 = c.alpha(0.8).css();
      const glow2 = c.alpha(0.6).css();
      const glow3 = c.alpha(0.4).css();
      
      return `0 0 5px ${bright}, 0 0 10px ${bright}, 0 0 15px ${bright}, 0 0 20px ${glow1}, 0 0 35px ${glow2}, 0 0 40px ${glow3}, 0 0 50px ${glow3}, 0 0 75px ${glow3}`;
    }
  },
  fire: {
    name: 'Fire Effect',
    description: 'Flickering flame-like shadows',
    generateShadow: (color: string) => {
      const c = chroma(color);
      const orange = c.set('hsl.h', '+30').css();
      const red = c.set('hsl.h', '-20').darken(0.3).css();
      const yellow = c.set('hsl.h', '+40').brighten(0.5).css();
      
      return `0 -2px 4px ${yellow}, 0 -4px 6px ${orange}, 0 -6px 8px ${red}, 0 0 15px ${c.alpha(0.5).css()}, 0 4px 20px ${red}`;
    }
  },
  retro: {
    name: '3D Retro',
    description: 'Classic 3D text effect',
    generateShadow: (color: string) => {
      const c = chroma(color);
      const dark = c.darken(2).css();
      const shadows = [];
      
      for (let i = 1; i <= 5; i++) {
        shadows.push(`${i}px ${i}px 0px ${dark}`);
      }
      
      return shadows.join(', ');
    }
  },
  soft: {
    name: 'Soft Shadow',
    description: 'Subtle, professional shadow',
    generateShadow: (color: string) => {
      const c = chroma(color);
      const shadow1 = c.darken(1).alpha(0.2).css();
      const shadow2 = c.darken(2).alpha(0.1).css();
      
      return `0 2px 4px ${shadow1}, 0 4px 8px ${shadow2}`;
    }
  },
  long: {
    name: 'Long Shadow',
    description: 'Dramatic long shadow effect',
    generateShadow: (color: string) => {
      const c = chroma(color);
      const shadows = [];
      
      for (let i = 1; i <= 40; i++) {
        const alpha = 0.3 - (i * 0.007);
        shadows.push(`${i}px ${i}px 0px ${c.darken(0.5).alpha(Math.max(alpha, 0)).css()}`);
      }
      
      return shadows.join(', ');
    }
  }
};

export default function TextShadowLab() {
  const [textColor, setTextColor] = useState('#ff8700');
  const [customShadow, setCustomShadow] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof shadowPresets>('glow');
  const [sampleText, setSampleText] = useState('Awesome Text');
  const [fontSize, setFontSize] = useState(72);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [fontFamily, setFontFamily] = useState('Proto Mono');
  const [fontWeight, setFontWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [colorMode, setColorMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');

  // Preset color palettes
  const colorPresets = {
    neon: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
    sunset: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#F38181'],
    cyberpunk: ['#00F0FF', '#FF00FF', '#FFFF00', '#00FF00', '#FF0080'],
    pastel: ['#FFB5E8', '#B28DFF', '#85E3FF', '#97A2FF', '#FFABAB'],
    dark: ['#E63946', '#A8DADC', '#457B9D', '#1D3557', '#F1FAEE'],
    vibrant: ['#F72585', '#B5179E', '#7209B7', '#480CA8', '#3F37C9'],
  };

  const backgroundPresets = ['#000000', '#1a1a1a', '#2d2d2d', '#f0f0f0', '#ffffff', '#0a0e27', '#1e0033', '#001233'];

  // Load Google Fonts
  useEffect(() => {
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@100;300;400;500;600;700;900&display=swap`;
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [fontFamily]);

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const c = chroma(hex);
    return { r: c.get('rgb.r'), g: c.get('rgb.g'), b: c.get('rgb.b') };
  };

  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    const c = chroma(hex);
    return { 
      h: Math.round(c.get('hsl.h') || 0), 
      s: Math.round(c.get('hsl.s') * 100), 
      l: Math.round(c.get('hsl.l') * 100) 
    };
  };

  const formatColor = (hex: string, mode: 'hex' | 'rgb' | 'hsl'): string => {
    if (mode === 'hex') return hex;
    if (mode === 'rgb') {
      const { r, g, b } = hexToRgb(hex);
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    const { h, s, l } = hexToHsl(hex);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const getCurrentShadow = () => {
    if (customShadow) return customShadow;
    return shadowPresets[selectedPreset].generateShadow(textColor);
  };

  const copyCss = () => {
    const fontFallback = googleFonts.find(f => f.value === fontFamily)?.category || 'sans-serif';
    const css = `font-family: '${fontFamily}', ${fontFallback};
font-weight: ${fontWeight};
font-size: ${fontSize}px;
line-height: ${lineHeight};
letter-spacing: ${letterSpacing}px;
color: ${formatColor(textColor, colorMode)};
text-shadow: ${getCurrentShadow()};`;
    navigator.clipboard.writeText(css);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-900 dark">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Text Shadow Laboratory</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Area */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div 
                className="p-8 flex items-center justify-center min-h-[400px]"
                style={{ backgroundColor }}
              >
                <h2 
                  className="text-center"
                  style={{
                    fontFamily: `'${fontFamily}', ${googleFonts.find(f => f.value === fontFamily)?.category || 'sans-serif'}`,
                    fontWeight,
                    color: textColor,
                    textShadow: getCurrentShadow(),
                    fontSize: `${fontSize}px`,
                    lineHeight,
                    letterSpacing: `${letterSpacing}px`
                  }}
                >
                  {sampleText}
                </h2>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            {/* Typography Section */}
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Typography</h3>
                
                {/* Font Family */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="font-family" className="text-gray-300">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger id="font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {googleFonts.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Weight and Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-300">Weight: {fontWeight}</Label>
                    <Slider
                      value={[fontWeight]}
                      onValueChange={([v]) => setFontWeight(v)}
                      min={100}
                      max={900}
                      step={100}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-300">Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={([v]) => setFontSize(v)}
                      min={12}
                      max={144}
                      step={1}
                    />
                  </div>
                </div>

                {/* Line Height and Letter Spacing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-300">Line Height: {lineHeight}</Label>
                    <Slider
                      value={[lineHeight]}
                      onValueChange={([v]) => setLineHeight(v)}
                      min={0.8}
                      max={2}
                      step={0.1}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-300">Letter Spacing: {letterSpacing}px</Label>
                    <Slider
                      value={[letterSpacing]}
                      onValueChange={([v]) => setLetterSpacing(v)}
                      min={-5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="sample-text" className="text-gray-300">Sample Text</Label>
              <Input
                id="sample-text"
                type="text"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>


            {/* Colors Section */}
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Colors</h3>
                
                {/* Color Mode Selector */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-300">Color Mode</Label>
                  <Select value={colorMode} onValueChange={(value) => setColorMode(value as 'hex' | 'rgb' | 'hsl')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hex">Hex</SelectItem>
                      <SelectItem value="rgb">RGB</SelectItem>
                      <SelectItem value="hsl">HSL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Color Picker */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-300">Text Color: {formatColor(textColor, colorMode)}</Label>
                  <div className="flex gap-4">
                    <HexColorPicker color={textColor} onChange={setTextColor} />
                    <Input
                      type="text"
                      value={formatColor(textColor, colorMode)}
                      onChange={(e) => {
                        try {
                          const color = chroma(e.target.value).hex();
                          setTextColor(color);
                        } catch {}
                      }}
                      className="w-40 bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Color Presets */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-300">Color Presets</Label>
                  <div className="flex flex-col gap-2">
                    {Object.entries(colorPresets).map(([name, colors]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16 capitalize">{name}</span>
                        <div className="flex gap-1">
                          {colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setTextColor(color)}
                              className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-300">Preview Background: {formatColor(backgroundColor, colorMode)}</Label>
                  <div className="flex gap-4">
                    <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
                    <Input
                      type="text"
                      value={formatColor(backgroundColor, colorMode)}
                      onChange={(e) => {
                        try {
                          const color = chroma(e.target.value).hex();
                          setBackgroundColor(color);
                        } catch {}
                      }}
                      className="w-40 bg-gray-800 border-gray-700 text-white font-mono text-sm"
                    />
                  </div>
                  {/* Background Presets */}
                  <div className="flex gap-1 mt-2">
                    {backgroundPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shadow Effects */}
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Shadow Effects</h3>
                
                {/* Preset Effects */}
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-300">Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(shadowPresets).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant={selectedPreset === key && !customShadow ? 'default' : 'outline'}
                        className="h-auto p-3 justify-start text-left"
                        onClick={() => {
                          setSelectedPreset(key as keyof typeof shadowPresets);
                          setCustomShadow('');
                        }}
                      >
                        <div>
                          <div className="font-semibold">{preset.name}</div>
                          <div className="text-xs opacity-75">{preset.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Shadow */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="custom-shadow" className="text-gray-300">Custom Shadow CSS</Label>
                  <Textarea
                    id="custom-shadow"
                    value={customShadow}
                    onChange={(e) => setCustomShadow(e.target.value)}
                    placeholder="Enter custom text-shadow CSS..."
                    className="bg-gray-800 border-gray-700 text-white h-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated CSS */}
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Generated CSS</h3>
                <div className="bg-gray-800 p-4 rounded font-mono text-sm text-gray-300 space-y-1">
                  <div>font-family: '{fontFamily}', {googleFonts.find(f => f.value === fontFamily)?.category || 'sans-serif'};</div>
                  <div>font-weight: {fontWeight};</div>
                  <div>font-size: {fontSize}px;</div>
                  <div>line-height: {lineHeight};</div>
                  <div>letter-spacing: {letterSpacing}px;</div>
                  <div>color: {formatColor(textColor, colorMode)};</div>
                  <div className="break-all">text-shadow: {getCurrentShadow()};</div>
                </div>
                <Button onClick={copyCss} className="w-full">
                  Copy CSS
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}