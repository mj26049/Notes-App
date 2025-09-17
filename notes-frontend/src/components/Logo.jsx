const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <svg
          className="w-10 h-10"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fox face shape */}
          <path
            d="M20 5L35 20L20 35L5 20L20 5Z"
            className="fill-fox-400"
          />
          {/* Fox ears */}
          <path
            d="M20 5L27 12L20 19L13 12L20 5Z"
            className="fill-fox-500"
          />
          {/* Fox face details */}
          <circle cx="16" cy="18" r="2" className="fill-white" />
          <circle cx="24" cy="18" r="2" className="fill-white" />
          <path
            d="M20 22C21.6569 22 23 23.3431 23 25C23 26.6569 21.6569 28 20 28C18.3431 28 17 26.6569 17 25C17 23.3431 18.3431 22 20 22Z"
            className="fill-white"
          />
        </svg>
        {/* Glowing effect */}
        <div className="absolute inset-0 bg-fox-400/20 blur-lg rounded-full"></div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-fox-500 to-fox-600 text-transparent bg-clip-text">
        FoxNotes
      </span>
    </div>
  );
};

export default Logo;
