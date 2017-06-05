exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://mallain23:afrojack22@ds163721.mlab.com:63721/blogdata';
exports.PORT = process.env.PORT || 8080;
