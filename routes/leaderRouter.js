const express = require('express');
const mongoose = require('mongoose');
const Leaders = require('../models/leaders');
//const common = require("./common");
const cors = require('./cors');
const authenticate = require('../authenticate');

const leaderRouter = express.Router();

leaderRouter.use(express.urlencoded({extended: true}));
leaderRouter.use(express.json());

//common (below 3 methods can be swapped out for common module methods)
var not_supported = (res, msg) => {
    res.statusCode = 403;
    res.end(msg);
}

var success_response = (res, content) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(content);
}

// var missing_record = (recordType, recordId) => {
//     err = new Error(recordType + " " + recordId + " not found");
//     err.status = 404;
//     return next(err);
// }


leaderRouter.route('/')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.get(cors.cors, (req, res, next) => {
    Leaders.find({})
    .then((leaders) => success_response(res, leaders), (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.create(req.body)
    .then((leader) => success_response(res, leader), (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    not_supported(res, 'PUT operation not supported on /leaders')
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.remove({})
        .then((resp) => success_response(res, resp), (err) => next(err))
        .catch((err) => next(err));
});

leaderRouter.route('/:leaderId')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.get(cors.cors, (req, res, next) => {
    Leaders.findById(req.params.leaderId)
    .then((leader) => success_response(res, leader), (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    not_supported(res, 'POST operation not supported on /leaders/'+ req.params.leaderId)
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.findByIdAndUpdate(req.params.leaderId, {$set: req.body}, { new: true })
        .then((leader) => success_response(res, leader), (err) => next(err))
        .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Leaders.findByIdAndRemove(req.params.leaderId)
    .then((leader) => success_response(res, leader), (err) => next(err))
    .catch((err) => next(err));
});

module.exports = leaderRouter;