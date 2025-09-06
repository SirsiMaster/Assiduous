"use strict";
(() => {
var exports = {};
exports.id = 843;
exports.ids = [843];
exports.modules = {

/***/ 730:
/***/ ((module) => {

module.exports = require("next/dist/server/api-utils/node.js");

/***/ }),

/***/ 76:
/***/ ((module) => {

module.exports = require("next/dist/server/future/route-modules/route-module.js");

/***/ }),

/***/ 583:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  config: () => (/* binding */ config),
  "default": () => (/* binding */ next_route_loaderkind_PAGES_API_page_2Fapi_2F_5Bcollection_5D_2F_5Bid_5D_preferredRegion_absolutePagePath_private_next_pages_2Fapi_2F_5Bcollection_5D_2F_5Bid_5D_js_middlewareConfigBase64_e30_3D_),
  routeModule: () => (/* binding */ routeModule)
});

// NAMESPACE OBJECT: ./src/pages/api/[collection]/[id].js
var _id_namespaceObject = {};
__webpack_require__.r(_id_namespaceObject);
__webpack_require__.d(_id_namespaceObject, {
  "default": () => (_id_)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/pages-api/module.js
var pages_api_module = __webpack_require__(429);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-kind.js
var route_kind = __webpack_require__(153);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader/helpers.js
var helpers = __webpack_require__(305);
;// CONCATENATED MODULE: ./src/pages/api/[collection]/[id].js
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
        const { collection, id } = req.query;
        const method = req.method;
        switch(method){
            case "GET":
                {
                    const doc = await Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/services/FirebaseService'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).findById(collection, id);
                    if (!doc) {
                        return res.status(404).json({
                            error: "Document not found"
                        });
                    }
                    return res.status(200).json(doc);
                }
            case "PUT":
            case "PATCH":
                {
                    const doc = await Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/services/FirebaseService'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).update(collection, id, req.body);
                    return res.status(200).json(doc);
                }
            case "DELETE":
                {
                    await Object(function webpackMissingModule() { var e = new Error("Cannot find module '@/services/FirebaseService'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).delete(collection, id);
                    return res.status(204).end();
                }
            default:
                res.setHeader("Allow", [
                    "GET",
                    "PUT",
                    "PATCH",
                    "DELETE"
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
/* harmony default export */ const _id_ = (handler);

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES_API&page=%2Fapi%2F%5Bcollection%5D%2F%5Bid%5D&preferredRegion=&absolutePagePath=private-next-pages%2Fapi%2F%5Bcollection%5D%2F%5Bid%5D.js&middlewareConfigBase64=e30%3D!
// @ts-ignore this need to be imported from next/dist to be external



const PagesAPIRouteModule = pages_api_module.PagesAPIRouteModule;
// Import the userland code.
// @ts-expect-error - replaced by webpack/turbopack loader

// Re-export the handler (should be the default export).
/* harmony default export */ const next_route_loaderkind_PAGES_API_page_2Fapi_2F_5Bcollection_5D_2F_5Bid_5D_preferredRegion_absolutePagePath_private_next_pages_2Fapi_2F_5Bcollection_5D_2F_5Bid_5D_js_middlewareConfigBase64_e30_3D_ = ((0,helpers/* hoist */.l)(_id_namespaceObject, "default"));
// Re-export config.
const config = (0,helpers/* hoist */.l)(_id_namespaceObject, "config");
// Create and export the route module that will be consumed.
const routeModule = new PagesAPIRouteModule({
    definition: {
        kind: route_kind/* RouteKind */.x.PAGES_API,
        page: "/api/[collection]/[id]",
        pathname: "/api/[collection]/[id]",
        // The following aren't used in production.
        bundlePath: "",
        filename: ""
    },
    userland: _id_namespaceObject
});

//# sourceMappingURL=pages-api.js.map

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [172], () => (__webpack_exec__(583)));
module.exports = __webpack_exports__;

})();