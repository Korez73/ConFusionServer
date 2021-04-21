const express = require('express');
const mongoose = require('mongoose');
const Promotions = require('../models/promotions');
//const common = require("./common");
const cors = require('./cors');
const authenticate = require('../authenticate');

const promoRouter = express.Router();

promoRouter.use(express.urlencoded({extended: true}));
promoRouter.use(express.json());

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

var missing_record = (recordType, recordId) => {
    err = new Error(recordType + " " + recordId + " not found");
    err.status = 404;
    return next(err);
}

promoRouter.route('/')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.get(cors.cors, (req, res, next) => {
    Promotions.find({})
    .then((promos) => success_response(res, promos), (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,  (req, res, next) => {
    Promotions.create(req.body)
    .then((promo) => success_response(res, promo), (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    not_supported(res, 'PUT operation not supported on /promotions')
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Promotions.remove({})
        .then((resp) => success_response(res, resp), (err) => next(err))
        .catch((err) => next(err));
});

promoRouter.route('/:promoId')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.get(cors.cors, (req, res, next) => {
    Promotions.findById(req.params.promoId)
    .then((promo) => success_response(res, promo), (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    not_supported(res, 'POST operation not supported on /promotions/'+ req.params.promoId)
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Promotions.findByIdAndUpdate(req.params.promoId, {$set: req.body}, { new: true })
        .then((promo) => success_response(res, promo), (err) => next(err))
        .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Promotions.findByIdAndRemove(req.params.promoId)
    .then((promo) => success_response(res, promo), (err) => next(err))
    .catch((err) => next(err));
});

module.exports = promoRouter;