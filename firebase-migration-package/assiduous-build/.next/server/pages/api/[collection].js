"use strict";
(() => {
var exports = {};
exports.id = 677;
exports.ids = [677];
exports.modules = {

/***/ 730:
/***/ ((module) => {

module.exports = require("next/dist/server/api-utils/node.js");

/***/ }),

/***/ 76:
/***/ ((module) => {

module.exports = require("next/dist/server/future/route-modules/route-module.js");

/***/ }),

/***/ 481:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  config: () => (/* binding */ config),
  "default": () => (/* binding */ next_route_loaderkind_PAGES_API_page_2Fapi_2F_5Bcollection_5D_preferredRegion_absolutePagePath_private_next_pages_2Fapi_2F_5Bcollection_5D_2Findex_js_middlewareConfigBase64_e30_3D_),
  routeModule: () => (/* binding */ routeModule)
});

// NAMESPACE OBJECT: ./src/pages/api/[collection]/index.js
var _collection_namespaceObject = {};
__webpack_require__.r(_collection_namespaceObject);
__webpack_require__.d(_collection_namespaceObject, {
  "default": () => (_collection_)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/pages-api/module.js
var pages_api_module = __webpack_require__(429);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-kind.js
var route_kind = __webpack_require__(153);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader/helpers.js
var helpers = __webpack_require__(305);
;// CONCATENATED MODULE: ./src/pages/api/[collection]/index.js
Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/services/FirebaseService'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/utils/auth'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());


const handler = async (req, res)=>{
    try {
        // Verify authentication
        const user = await Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/utils/auth'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(req);
        if (!user) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        const { collection } = req.query;
        const method = req.method;
        switch(method){
            case "GET":
                {
                    // Parse query parameters
                    const { where, orderBy, limit, startAfter } = req.query;
                    const queryParams = {
                        where: where ? JSON.parse(where) : undefined,
                        orderBy: orderBy ? JSON.parse(orderBy) : undefined,
                        limit: limit ? parseInt(limit, 10) : undefined,
                        startAfter: startAfter || undefined
                    };
                    const docs = await Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/services/FirebaseService'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).find(collection, queryParams);
                    return res.status(200).json(docs);
                }
            case "POST":
                {
                    const doc = await Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/services/FirebaseService'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).create(collection, req.body);
                    return res.status(201).json(doc);
                }
            default:
                res.setHeader("Allow", [
                    "GET",
                    "POST"
                ]);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
};
/* harmony default export */ const _collection_ = (handler);

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES_API&page=%2Fapi%2F%5Bcollection%5D&preferredRegion=&absolutePagePath=private-next-pages%2Fapi%2F%5Bcollection%5D%2Findex.js&middlewareConfigBase64=e30%3D!
// @ts-ignore this need to be imported from next/dist to be external



const PagesAPIRouteModule = pages_api_module.PagesAPIRouteModule;
// Import the userland code.
// @ts-expect-error - replaced by webpack/turbopack loader

// Re-export the handler (should be the default export).
/* harmony default export */ const next_route_loaderkind_PAGES_API_page_2Fapi_2F_5Bcollection_5D_preferredRegion_absolutePagePath_private_next_pages_2Fapi_2F_5Bcollection_5D_2Findex_js_middlewareConfigBase64_e30_3D_ = ((0,helpers/* hoist */.l)(_collection_namespaceObject, "default"));
// Re-export config.
const config = (0,helpers/* hoist */.l)(_collection_namespaceObject, "config");
// Create and export the route module that will be consumed.
const routeModule = new PagesAPIRouteModule({
    definition: {
        kind: route_kind/* RouteKind */.x.PAGES_API,
        page: "/api/[collection]",
        pathname: "/api/[collection]",
        // The following aren't used in production.
        bundlePath: "",
        filename: ""
    },
    userland: _collection_namespaceObject
});

//# sourceMappingURL=pages-api.js.map

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [172], () => (__webpack_exec__(481)));
module.exports = __webpack_exports__;

})();