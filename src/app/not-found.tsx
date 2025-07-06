import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center px-4 relative overflow-hidden">
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
      <div className="absolute top-20 right-20 w-10 h-10 bg-blue-400/20 rounded-full animate-bounce delay-600">
        <div className="w-full h-full flex items-center justify-center text-lg">
          🥗
        </div>
      </div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-indigo-400/20 rounded-full animate-bounce delay-900">
        <div className="w-full h-full flex items-center justify-center text-lg">
          🍰
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center text-white z-10 px-8 max-w-2xl mx-auto flex flex-col items-center justify-center">
        {/* 404 with Pizza Icon */}
        <div className="relative mb-8">
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-orange-600 font-bold text-2xl">🍕</span>
          </div>
          <h1 className="text-8xl font-bold text-white mb-4 drop-shadow-lg">
            404
          </h1>
        </div>

        {/* Confused Character Animation */}
        <div className="mb-8 relative">
          <div className="confused-character bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            {/* Character Body */}
            <div className="character-body">
              {/* Head */}
              <div className="head">
                <div className="face">
                  <div className="eyes">
                    <div className="eye left-eye"></div>
                    <div className="eye right-eye"></div>
                  </div>
                  <div className="mouth"></div>
                </div>
                <div className="hair"></div>
              </div>

              {/* Body */}
              <div className="body">
                <div className="shirt"></div>
                <div className="arms">
                  <div className="arm left-arm"></div>
                  <div className="arm right-arm"></div>
                </div>
              </div>

              {/* Legs */}
              <div className="legs">
                <div className="leg left-leg"></div>
                <div className="leg right-leg"></div>
              </div>
            </div>

            {/* Confusion indicators */}
            <div className="confusion-marks">
              <div className="question-mark q1">?</div>
              <div className="question-mark q2">?</div>
              <div className="question-mark q3">?</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
            Oops! You seem lost in our kitchen
          </h2>
          <p className="text-orange-100 text-xl mb-2">
            The page you&apos;re looking for is not on our menu!
          </p>
          <p className="text-orange-200 text-lg">
            But don&apos;t worry, we have plenty of delicious options waiting
            for you
            🍽️
          </p>
        </div>

        {/* Go to Home Button */}
        <Link
          href="/"
          className="inline-block bg-white text-orange-500 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          🏠 Back to Home Kitchen
        </Link>

      </div>
    </div>
  );
}
