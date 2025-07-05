"use client";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>

      {/* Right Side - Food Ordering Design */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-orange-400 to-red-500 relative overflow-hidden">
        <div className="text-center text-white z-10 px-8">
          <div className="w-96 h-96 mx-auto mb-12">
            <svg
              className="w-full h-full opacity-95"
              viewBox="0 0 500 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background elements */}
              <circle cx="100" cy="100" r="8" fill="#FFF3E0" opacity="0.3" />
              <circle cx="400" cy="150" r="6" fill="#FFF3E0" opacity="0.4" />
              <circle cx="350" cy="80" r="4" fill="#FFF3E0" opacity="0.5" />

              {/* Person with phone */}
              {/* Head */}
              <circle cx="250" cy="180" r="40" fill="#FFD1A3" />
              {/* Hair */}
              <path
                d="M210 150 Q250 110 290 150 Q290 130 250 125 Q210 130 210 150"
                fill="#8B4513"
              />
              {/* Body */}
              <path d="M210 220 L290 220 L285 300 L215 300 Z" fill="#4A90E2" />
              {/* Arms */}
              <path d="M210 230 L170 260 L175 290 L210 270 Z" fill="#FFD1A3" />
              <path d="M290 230 L330 260 L325 290 L290 270 Z" fill="#FFD1A3" />
              {/* Legs */}
              <path d="M225 300 L250 300 L245 370 L230 370 Z" fill="#2E2E2E" />
              <path d="M250 300 L275 300 L270 370 L255 370 Z" fill="#2E2E2E" />
              {/* Shoes */}
              <path d="M225 370 L250 370 L250 385 L220 385 Z" fill="#8B4513" />
              <path d="M250 370 L275 370 L280 385 L250 385 Z" fill="#8B4513" />

              {/* Phone/Tablet */}
              <rect
                x="300"
                y="250"
                width="35"
                height="50"
                rx="8"
                fill="#2D3748"
              />
              <rect
                x="303"
                y="253"
                width="29"
                height="44"
                rx="4"
                fill="#FFFFFF"
              />

              {/* Food app interface on phone */}
              <rect
                x="305"
                y="255"
                width="25"
                height="8"
                rx="2"
                fill="#FF6B6B"
              />
              <rect
                x="305"
                y="266"
                width="12"
                height="6"
                rx="1"
                fill="#4ECDC4"
              />
              <rect
                x="320"
                y="266"
                width="10"
                height="6"
                rx="1"
                fill="#45B7D1"
              />
              <rect
                x="305"
                y="275"
                width="25"
                height="4"
                rx="1"
                fill="#96CEB4"
              />
              <rect
                x="305"
                y="282"
                width="25"
                height="4"
                rx="1"
                fill="#FFEAA7"
              />
              <rect
                x="305"
                y="289"
                width="25"
                height="6"
                rx="1"
                fill="#FF7675"
              />

              {/* Eyes */}
              <circle cx="235" cy="170" r="4" fill="#2D3748" />
              <circle cx="265" cy="170" r="4" fill="#2D3748" />
              {/* Smile */}
              <path
                d="M235 195 Q250 205 265 195"
                stroke="#2D3748"
                strokeWidth="3"
                fill="none"
              />

              {/* Food items floating around */}

              {/* Pizza slice */}
              <g transform="translate(80, 280)">
                <path d="M0 0 L30 0 L15 25 Z" fill="#FFD93D" />
                <path d="M0 0 L30 0 L15 25 Z" fill="#FF6B6B" opacity="0.8" />
                <circle cx="8" cy="8" r="2" fill="#FF4757" />
                <circle cx="20" cy="6" r="2" fill="#2ED573" />
                <circle cx="12" cy="15" r="2" fill="#FFA502" />
                <circle cx="18" cy="18" r="2" fill="#FF4757" />
              </g>

              {/* Burger */}
              <g transform="translate(350, 320)">
                <ellipse cx="15" cy="12" rx="15" ry="5" fill="#D4A574" />
                <ellipse cx="15" cy="16" rx="13" ry="3" fill="#2ED573" />
                <ellipse cx="15" cy="19" rx="14" ry="4" fill="#8B4513" />
                <ellipse cx="15" cy="23" rx="13" ry="3" fill="#FFD93D" />
                <ellipse cx="15" cy="26" rx="13" ry="3" fill="#FF6B6B" />
                <ellipse cx="15" cy="30" rx="15" ry="5" fill="#D4A574" />
                <circle cx="8" cy="30" r="1" fill="#8B4513" />
                <circle cx="22" cy="30" r="1" fill="#8B4513" />
                <circle cx="15" cy="32" r="1" fill="#8B4513" />
              </g>

              {/* Coffee cup */}
              <g transform="translate(120, 180)">
                <rect
                  x="0"
                  y="8"
                  width="20"
                  height="22"
                  rx="2"
                  fill="#8B4513"
                />
                <rect
                  x="2"
                  y="10"
                  width="16"
                  height="18"
                  rx="1"
                  fill="#3D2914"
                />
                <ellipse cx="10" cy="10" rx="8" ry="2" fill="#5D4037" />
                <path
                  d="M20 15 Q25 15 25 20 Q25 25 20 25"
                  stroke="#8B4513"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M6 5 Q8 2 10 5 M10 5 Q12 2 14 5"
                  stroke="#E0E0E0"
                  strokeWidth="1"
                  fill="none"
                />
              </g>

              {/* Donut */}
              <g transform="translate(380, 200)">
                <circle cx="12" cy="12" r="12" fill="#FFB6C1" />
                <circle cx="12" cy="12" r="5" fill="#FFF" />
                <circle cx="8" cy="8" r="1" fill="#FF69B4" />
                <circle cx="16" cy="7" r="1" fill="#00CED1" />
                <circle cx="6" cy="14" r="1" fill="#32CD32" />
                <circle cx="18" cy="15" r="1" fill="#FFD700" />
                <circle cx="12" cy="18" r="1" fill="#FF4500" />
              </g>

              {/* Sushi */}
              <g transform="translate(60, 200)">
                <ellipse cx="12" cy="8" rx="12" ry="8" fill="#2D3748" />
                <ellipse cx="12" cy="8" rx="10" ry="6" fill="#FFFFFF" />
                <ellipse cx="12" cy="8" rx="8" ry="4" fill="#FF6B6B" />
                <ellipse cx="12" cy="8" rx="6" ry="2" fill="#2ED573" />
              </g>

              {/* Taco */}
              <g transform="translate(400, 280)">
                <path d="M0 10 Q15 0 30 10 L25 20 L5 20 Z" fill="#D4A574" />
                <path d="M5 12 L25 12 L23 18 L7 18 Z" fill="#2ED573" />
                <path d="M7 14 L23 14 L21 16 L9 16 Z" fill="#FF6B6B" />
                <path d="M9 15 L21 15" stroke="#FFD93D" strokeWidth="1" />
              </g>

              {/* Rating stars */}
              <g transform="translate(150, 320)">
                <path
                  d="M5 0 L6 3 L10 3 L7 5 L8 9 L5 7 L2 9 L3 5 L0 3 L4 3 Z"
                  fill="#FFD700"
                />
                <path
                  d="M15 0 L16 3 L20 3 L17 5 L18 9 L15 7 L12 9 L13 5 L10 3 L14 3 Z"
                  fill="#FFD700"
                />
                <path
                  d="M25 0 L26 3 L30 3 L27 5 L28 9 L25 7 L22 9 L23 5 L20 3 L24 3 Z"
                  fill="#FFD700"
                />
                <path
                  d="M35 0 L36 3 L40 3 L37 5 L38 9 L35 7 L32 9 L33 5 L30 3 L34 3 Z"
                  fill="#FFD700"
                />
                <path
                  d="M45 0 L46 3 L50 3 L47 5 L48 9 L45 7 L42 9 L43 5 L40 3 L44 3 Z"
                  fill="#FFD700"
                />
              </g>

              {/* Order notification */}
              <g transform="translate(320, 180)">
                <circle cx="15" cy="15" r="15" fill="#4CAF50" />
                <path
                  d="M8 15 L13 20 L22 10"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              </g>

              {/* Delivery bike */}
              <g transform="translate(100, 350)">
                <circle cx="8" cy="15" r="8" fill="#2D3748" />
                <circle cx="8" cy="15" r="5" fill="#4A5568" />
                <circle cx="35" cy="15" r="8" fill="#2D3748" />
                <circle cx="35" cy="15" r="5" fill="#4A5568" />
                <path
                  d="M8 15 L20 15 L25 8 L35 8"
                  stroke="#4A5568"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M15 15 L15 8 L25 8"
                  stroke="#4A5568"
                  strokeWidth="3"
                  fill="none"
                />
                <rect
                  x="18"
                  y="5"
                  width="12"
                  height="6"
                  rx="2"
                  fill="#FF6B6B"
                />
              </g>
            </svg>
          </div>
          <div className="relative max-w-md mx-auto">
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-orange-600 font-bold text-xl">🍕</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Welcome to Kensho
            </h2>
            <p className="text-orange-100 text-xl leading-relaxed">
              Discover amazing restaurants, browse delicious menus, and order
              your favorite food with ease
            </p>
          </div>
        </div>

        {/* Enhanced decorative food elements */}
        <div className="absolute top-16 left-16 w-16 h-16 bg-yellow-400/20 rounded-full animate-bounce delay-300">
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🍔
          </div>
        </div>
        <div className="absolute bottom-16 right-16 w-12 h-12 bg-red-400/20 rounded-full animate-bounce delay-700">
          <div className="w-full h-full flex items-center justify-center text-xl">
            🍕
          </div>
        </div>
        <div className="absolute top-1/2 left-8 w-14 h-14 bg-orange-400/20 rounded-full animate-bounce delay-1000">
          <div className="w-full h-full flex items-center justify-center text-xl">
            ☕
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/4 w-10 h-10 bg-pink-400/20 rounded-full animate-bounce delay-500">
          <div className="w-full h-full flex items-center justify-center text-lg">
            🍩
          </div>
        </div>
        <div className="absolute top-1/4 right-1/3 w-12 h-12 bg-green-400/20 rounded-full animate-bounce delay-200">
          <div className="w-full h-full flex items-center justify-center text-lg">
            🌮
          </div>
        </div>
        <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-purple-400/20 rounded-full animate-bounce delay-800">
          <div className="w-full h-full flex items-center justify-center text-sm">
            🍣
          </div>
        </div>
        <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-yellow-300/20 rounded-full animate-bounce delay-400">
          <div className="w-full h-full flex items-center justify-center text-lg">
            ⭐
          </div>
        </div>
      </div>
    </div>
  );
};
