export const RivetlyIcon = ({ className = "w-8 h-8" }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 极简几何 R 路径 - 仅 1 条路径 */}
    <path
      d="M30 85V15H58C75 15 75 42 58 42H30M58 42L78 85"
      stroke="#FD4802"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* 核心铆钉元素 */}
    <circle cx="50" cy="42" r="6" fill="#FD4802" />
  </svg>
);
