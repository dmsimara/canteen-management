import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, adminId) => {
    const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('adminToken', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
     });

    return token;
}

export const generateStaffTokenAndCookie = (res, staffId) => {
    const staffToken = jwt.sign({ staffId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('staffToken', staffToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
     });

    return staffToken;
}