'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://admin:password123@ds161391.mlab.com:61391/my-blog-api-test';
exports.TEST_DATABASE_URL = 'mongodb://admin:password123@ds161391.mlab.com:61391/my-blog-api-test';
exports.PORT = process.env.PORT || 8080;
