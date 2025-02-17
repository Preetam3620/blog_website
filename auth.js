const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    azureId: { type: String, required: true, unique: true },
    name: String,
    email: String
  });
  const User = mongoose.model('User', userSchema);

passport.use(new OIDCStrategy({
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: process.env.AZURE_REDIRECT_URI,
    allowHttpForRedirectUrl: true,
    passReqToCallback: false,
    scope: ['profile', 'email', 'openid']
}, async (iss, sub, profile, accessToken, refreshToken, done) => {
    try {
        let user = await User.findOne({ azureId: profile.oid });
        if (!user) {
            user = await User.create({
                azureId: profile.oid,
                name: profile.displayName,
                email: profile._json.preferred_username
            });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});
