module.exports = class Sefmap {
    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    constructor () {
        this._map = [];
        this._temp = [];
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    get () {
        // return
        return this._getMap ();
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    push (parameters) {
        // parameters
        var model = parameters.model;
        var infos = parameters.infos;
        // clone
        infos = this._clone (infos);
        // clean
        this._cleanInfos ({
            infos : infos
        });
        // get
        var relations = this._getRelationFromInfos ({
            infos : infos ,exit
        });
        // model
        var model = this._modelMap ({
            model : model ,
            table : infos.tableName ,
            id : infos.idAttribute ,
            relations : relations ,
        });
        // push
        this._pushMap (model);
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _getRelationFromInfos (parameters) {
        // parameters
        var infos = parameters.infos;
        // default
        var relations = [];
        // loop
        for (var i in infos) {
            // extract
            var extracted = this._extractRelation ({
                relation : infos[i]
            });
            // push
            relations.push(extracted);
        }
        // return
        return relations;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _getForeignFromInfos (parameters) {
        // parameters
        var infos = parameters.infos;
        // return
        return 125;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _helperNoSpace (string) {
        string = string.replace (/\s/g , "");
        // return
        return string;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _helperFunctionToString (fonction) {
        fonction = fonction.toString ();
        // return
        return fonction;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _cleanRelation (relation) {
        relation = this._helperFunctionToString (relation);
        relation = this._helperNoSpace (relation);
        relation = this._helperNoGuillmet (relation);
        // return
        return relation;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _helperNoGuillmet (string) {
        string = string.replace (/\"/g , "");
        string = string.replace (/\'/g , "");
        // return
        return string;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _extractRelation (parameters) {
        // parameters
        var relation = parameters.relation;
        // default
        var model = false;
        // clean
        var string = this._cleanRelation (relation);
        // regex
        var regex = /(hasOne|hasMany|morphOne|morphTo|morphMany|belongsTo|belongsToMany)\((.*?)\)/;
        var matchs = string.match (regex);
        if (matchs != null) {
            var type = matchs[1];
            var attributes = matchs[2].split (",");
            model = {
                type : type,
                attributes : attributes,
            };
        }
        // return
        return model;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _cleanInfos (parameters) {
        // parameters
        var infos = parameters.infos;
        // loop
        for (var i in infos) {
            if (i == "tableName" || i == "idAttribute") {
                delete infos[i];
            }
        }
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _getMap () {
        // return
        return this._map;
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _pushMap (value) {
        this._map.push (value);
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _findMapByModelOrTemporize (parameters) {
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _modelMap (parameters) {
        // default
        var model = "";
        var table = "";
        var id = "";
        var relations = [];
        // control
        if (parameters.hasOwnProperty ("model")) {
            model = parameters.model;
        }
        // control
        if (parameters.hasOwnProperty ("table")) {
            table = parameters.table;
        }
        // control
        if (parameters.hasOwnProperty ("id")) {
            id = parameters.id;
        }
        // control
        if (parameters.hasOwnProperty ("relations")) {
            relations = parameters.relations;
        }
        // return
        return {
            model : model ,
            table : table ,
            id : id ,
            relations : relations ,
        };
    }

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _clone (obj) {
        if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj) {
            return obj;
        }
        if (obj instanceof Date) {
            var temp = new obj.constructor ();
        }
        else {
            var temp = obj.constructor ();
        }
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call (obj , key)) {
                obj['isActiveClone'] = null;
                temp[key] = this._clone (obj[key]);
                delete obj['isActiveClone'];
            }
        }
        return temp;
    }
}