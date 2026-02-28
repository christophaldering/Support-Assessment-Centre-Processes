"use client";

interface AvatarCircleProps {
  avatarUrl?: string | null;
  code: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: 32, md: 40, lg: 48 };

export default function AvatarCircle({ avatarUrl, code, size = "md" }: AvatarCircleProps) {
  const px = sizes[size];
  const fontSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  if (avatarUrl) {
    return (
      <img
        data-testid="bdp-avatar-image"
        src={avatarUrl}
        alt={code}
        className="rounded-full object-cover ring-2 ring-transparent hover:ring-[#FFD700] transition-all shadow-sm"
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      data-testid="bdp-avatar-image"
      className={`rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold ${fontSize} shrink-0 ring-2 ring-transparent hover:ring-[#FFD700]/50 transition-all`}
      style={{ width: px, height: px }}
    >
      {code[0]}
    </div>
  );
}
