export default function SvgGrid() {
    return (
        <div className="relative min-h-[calc(545/16*1rem)]">
            <div className="relative z-20 [--animation-duration:250ms] [&>div]:animate-fade-in"></div>
            <div className="pointer-events-none absolute inset-0">
                <svg
                    fill="none"
                    viewBox="0 0 301 461"
                    aria-hidden="true"
                    className="absolute left-full top-16 ml-2 w-72 [mask-image:radial-gradient(circle_at_top_left,black,transparent_theme(spacing.72))]"
                >
                    <g filter="url(#filter0_d_35_2)">
                        <path
                            fill="#fff"
                            d="m4.705 141.252 36.53-37.442a6.002 6.002 0 0 1 4.294-1.81h102.409a6.002 6.002 0 0 0 4.334-1.851l91.581-95.673a6 6 0 0 1 4.334-1.851H292a6 6 0 0 1 6 6V452a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V145.442a6 6 0 0 1 1.705-4.19Z"
                        />
                    </g>
                    <defs>
                        <filter
                            id="filter0_d_35_2"
                            width="300"
                            height="460.375"
                            x=".5"
                            y=".125"
                            colorInterpolationFilters="sRGB"
                            filterUnits="userSpaceOnUse"
                        >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.25" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
                            <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_35_2" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_35_2" result="shape" />
                        </filter>
                    </defs>
                </svg>

                <svg
                    fill="none"
                    viewBox="0 0 301 461"
                    aria-hidden="true"
                    className="absolute right-full top-16 mr-2 w-72 -scale-x-100 [mask-image:radial-gradient(circle_at_top_left,black,transparent_theme(spacing.72))]"
                >
                    <g filter="url(#filter0_d_35_2_mirror)">
                        <path
                            fill="#fff"
                            d="m4.705 141.252 36.53-37.442a6.002 6.002 0 0 1 4.294-1.81h102.409a6.002 6.002 0 0 0 4.334-1.851l91.581-95.673a6 6 0 0 1 4.334-1.851H292a6 6 0 0 1 6 6V452a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V145.442a6 6 0 0 1 1.705-4.19Z"
                        />
                    </g>
                    <defs>
                        <filter
                            id="filter0_d_35_2_mirror"
                            width="300"
                            height="460.375"
                            x=".5"
                            y=".125"
                            colorInterpolationFilters="sRGB"
                            filterUnits="userSpaceOnUse"
                        >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix
                                in="SourceAlpha"
                                result="hardAlpha"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.25" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
                            <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_35_2" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_35_2" result="shape" />
                        </filter>
                    </defs>
                </svg>

                <div className="absolute left-1/2 top-10 h-[9.25rem] w-[calc(100%+(10.125rem*2))] -translate-x-1/2 overflow-hidden">
                    <div className="absolute left-1/2 h-[111px] w-[1216px] -translate-x-1/2">
                        <svg fill="none" viewBox="0 0 1216 111" aria-hidden="true">
                            <path
                                className="stroke-black/5"
                                d="M0 110h347.654a7.999 7.999 0 0 0 5.696-2.383L455.9 3.633a8.001 8.001 0 0 1 5.696-2.383h292.308c2.141 0 4.192.858 5.696 2.383l102.55 103.984a7.999 7.999 0 0 0 5.696 2.383H1216"
                            />
                        </svg>
                        <canvas
                            className="absolute inset-0 h-full w-full"
                            aria-hidden="true"
                            width="2432"
                            height="222"
                        />
                        <svg width="0" height="0" aria-hidden="true">
                            <path d="M0 110h347.654a7.999 7.999 0 0 0 5.696-2.383L455.9 3.633a8.001 8.001 0 0 1 5.696-2.383h292.308c2.141 0 4.192.858 5.696 2.383l102.55 103.984a7.999 7.999 0 0 0 5.696 2.383H1216" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
} 