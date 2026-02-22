const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists by googleId or email
                let user = await User.findOne({
                    $or: [
                        { googleId: profile.id },
                        { email: profile.emails[0].value },
                    ],
                });

                if (user) {
                    // Update Google info if user existed via email signup
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.authProvider = user.authProvider === 'local' ? 'both' : 'google';
                        if (!user.profilePhoto && profile.photos?.[0]?.value) {
                            user.profilePhoto = profile.photos[0].value;
                        }
                        await user.save();
                    }
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    profilePhoto: profile.photos?.[0]?.value || '',
                    authProvider: 'google',
                    skills: getDefaultSkills(),
                });

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

function getDefaultSkills() {
    const categories = [
        'Logical Reasoning',
        'Data Structures',
        'Algorithms',
        'Problem Solving',
        'Debugging',
        'SQL & Databases',
    ];
    return categories.map((name) => ({
        skillName: name,
        level: 1,
        xp: 0,
        weakAreas: [],
    }));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
