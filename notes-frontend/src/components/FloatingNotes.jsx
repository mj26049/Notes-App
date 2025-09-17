const FloatingNotes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left note */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-lg rotate-12 animate-float-slow" />
      
      {/* Top right note */}
      <div className="absolute top-1/4 -right-4 w-32 h-32 bg-white/10 rounded-lg -rotate-12 animate-float-slower" />
      
      {/* Bottom left note */}
      <div className="absolute bottom-1/4 -left-8 w-28 h-28 bg-white/10 rounded-lg rotate-45 animate-float-slowest" />
      
      {/* Center background note */}
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-lg -rotate-12 animate-float-slower" />
      
      {/* Small decorative notes */}
      <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/5 rounded-lg rotate-12 animate-float-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-white/5 rounded-lg rotate-45 animate-float-slowest" />
    </div>
  );
};

export default FloatingNotes;
