import prisma from "../../config/db.js";
const lookupUserByEmail = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { fullName: true },
    });
    if (!user)
        return { exists: false };
    return { exists: true, fullName: user.fullName };
};
export { lookupUserByEmail };
//# sourceMappingURL=users.service.js.map