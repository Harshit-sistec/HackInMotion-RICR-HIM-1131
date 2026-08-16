import type { User } from '@/types';

function initialsFor(name?: string) {
  return (name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({
  user,
  size = 32,
  className = '',
}: {
  user: Pick<User, 'name' | 'avatarColor' | 'avatarImage'> | null | undefined;
  size?: number;
  className?: string;
}) {
  if (user?.avatarImage) {
    return (
      <img
        src={user.avatarImage}
        alt={user.name ?? 'Profile'}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: user?.avatarColor ?? 'var(--nova-primary)' }}
    >
      {initialsFor(user?.name)}
    </div>
  );
}
