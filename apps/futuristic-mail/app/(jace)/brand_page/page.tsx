export default function BrandPage() {
    return (
        <div>
            <style jsx>{`
                @keyframes hueRotateAqua {
                    0% { fill: hsla(180, 70%, 85%, 1); }
                    25% { fill: hsla(270, 70%, 85%, 1); }
                    50% { fill: hsla(0, 70%, 85%, 1); }
                    75% { fill: hsla(90, 70%, 85%, 1); }
                    100% { fill: hsla(180, 70%, 85%, 1); }
                }
                
                @keyframes hueRotateGreen {
                    0% { fill: hsla(120, 60%, 75%, 0.33); }
                    25% { fill: hsla(210, 60%, 75%, 0.33); }
                    50% { fill: hsla(300, 60%, 75%, 0.33); }
                    75% { fill: hsla(30, 60%, 75%, 0.33); }
                    100% { fill: hsla(120, 60%, 75%, 0.33); }
                }
                
                @keyframes hueRotateBlue {
                    0% { fill: hsla(220, 70%, 85%, 1); }
                    25% { fill: hsla(310, 70%, 85%, 1); }
                    50% { fill: hsla(40, 70%, 85%, 1); }
                    75% { fill: hsla(130, 70%, 85%, 1); }
                    100% { fill: hsla(220, 70%, 85%, 1); }
                }
                
                @keyframes unfoldLeft {
                    0% { 
                        transform: rotate(-90deg) scale(0.3);
                    }
                    100% { 
                        transform: rotate(0deg) scale(1);
                    }
                }
                
                @keyframes unfoldCenter {
                    0% { 
                        transform: rotate(180deg) scale(0.2);
                    }
                    100% { 
                        transform: rotate(0deg) scale(1);
                    }
                }
                
                @keyframes unfoldRight {
                    0% { 
                        transform: rotate(90deg) scale(0.3);
                    }
                    100% { 
                        transform: rotate(0deg) scale(1);
                    }
                }
                
                .wing-left {
                    animation: hueRotateAqua 8s linear infinite, unfoldLeft 2s ease-out;
                    transform-origin: center;
                }
                
                .wing-center {
                    animation: hueRotateGreen 8s linear infinite 2.5s, unfoldCenter 2.5s ease-out 0.5s;
                    transform-origin: center;
                }
                
                .wing-right {
                    animation: hueRotateBlue 8s linear infinite 5s, unfoldRight 2s ease-out 1s;
                    transform-origin: center;
                }
            `}</style>

            <div>
                <svg width="413" height="298" viewBox="0 0 413 298" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        className="wing-left"
                        d="M81.2728 91.4218C189.329 245.27 320.788 335.441 263.256 196.378C217.231 85.1272 122.757 80.0527 81.2728 91.4218Z"
                    />
                    <path
                        className="wing-center"
                        d="M53.55 126.066C186.716 258.777 331.855 324.71 251.014 197.772C186.341 96.2214 92.4245 107.655 53.55 126.066Z"
                    />
                    <path
                        className="wing-right"
                        d="M144.122 43.1111C197.981 222.878 293.89 349.462 283.116 199.475C274.496 79.4858 186.862 45.2369 144.122 43.1111Z"
                    />
                </svg>
            </div>
        </div>
    );
} 