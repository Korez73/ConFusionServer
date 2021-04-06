exports.notSupported = (res, msg) => {
    res.statusCode = 403;
    res.end(msg);
}

exports.successResponse = (res, content) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(content);
}

exports.missingRecord = (recordType, recordId) => {
    err = new Error(recordType + " " + recordId + " not found");
    err.status = 404;
    return next(err);
}