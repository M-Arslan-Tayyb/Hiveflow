import prisma from "@/config/db.js";

interface UserLookupResult {
  exists: boolean;
  fullName?: string;
}

const lookupUserByEmail = async (email: string): Promise<UserLookupResult> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { fullName: true },
  });

  if (!user) return { exists: false };

  return { exists: true, fullName: user.fullName };
};

export { lookupUserByEmail };
