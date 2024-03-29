const express = require('express');
//const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer');
const cors = require('./cors');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'public/images');
    },

    filename: (_, file, cb) => {
        cb(null, file.originalname)
    }
});

const imageFileFilter = (_, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('You can upload only image files!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});

const uploadRouter = express.Router();

//uploadRouter.use(bodyParser.json());
uploadRouter.use(express.urlencoded({extended: true}));
uploadRouter.use(express.json());

uploadRouter.route('/')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, (_req, res, _next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /imageUpload');
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(req.file);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (_req, res, _next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /imageUpload');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (_req, res, _next) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported on /imageUpload');
});

module.exports = uploadRouter;