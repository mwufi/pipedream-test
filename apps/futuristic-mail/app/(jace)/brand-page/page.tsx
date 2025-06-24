'use client'

export default function BrandPage() {
    return (
        <div>
            <style jsx>{`
                @keyframes hueRotate {
                    0% { fill: hsla(60, 70%, 85%, 1); }
                    25% { fill: hsla(150, 70%, 85%, 1); }
                    50% { fill: hsla(240, 70%, 85%, 1); }
                    75% { fill: hsla(330, 70%, 85%, 1); }
                    100% { fill: hsla(60, 70%, 85%, 1); }
                }
                
                @keyframes hueRotateTransparent {
                    0% { fill: hsla(120, 60%, 75%, 0.33); }
                    25% { fill: hsla(210, 60%, 75%, 0.33); }
                    50% { fill: hsla(300, 60%, 75%, 0.33); }
                    75% { fill: hsla(30, 60%, 75%, 0.33); }
                    100% { fill: hsla(120, 60%, 75%, 0.33); }
                }
                
                .yellow-path {
                    animation: hueRotate 8s linear infinite;
                }
                
                .transparent-path {
                    animation: hueRotateTransparent 8s linear infinite 4s;
                }
            `}</style>

            <div>
                <svg width="633" height="220" viewBox="0 0 633 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        className="yellow-path"
                        d="M86.2728 24.4218C194.329 178.27 325.788 268.441 268.256 129.378C222.231 18.1272 127.757 13.0527 86.2728 24.4218Z"
                    />
                    <path
                        className="transparent-path"
                        d="M63.9408 38.402C171.997 192.25 303.456 282.421 245.925 143.358C199.899 32.1073 105.425 27.0329 63.9408 38.402Z"
                    />
                    <path
                        className="yellow-path"
                        d="M550.064 27.4218C446.186 181.27 319.811 271.441 375.118 132.378C419.364 21.1272 510.184 16.0527 550.064 27.4218Z"
                    />
                    <path
                        className="transparent-path"
                        d="M571.532 41.402C467.655 195.25 341.279 285.421 396.586 146.358C440.832 35.1073 531.652 30.0329 571.532 41.402Z"
                    />
                </svg>
            </div>
        </div>
    );
} 