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
        // dependency
        this.knex_conf = require ("../../../../../config/KnexConf");
        this.knex = require ('knex') (this.knex_conf);
        this.fs = require ("fs");
        // default
        this._debug = [];
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
        return this;
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
        console.log ("---------------------------------------------------");
        console.log ("src");
        // clone
        parameters = this._clone (parameters);
        // control
        if (!parameters.hasOwnProperty ("infos")) {
            return false;
        }
        // parameters
        var model = parameters.model;
        var infos = parameters.infos;
        // model
        var model_map = this._modelMap ({
            model : model ,
            table : infos.tableName ,
            id : this._getIdAttribute (infos.idAttribute) ,
        });
        // push
        this._pushMap (model_map);
        // clone
        var infos_cloned = this._clone (infos);
        // clean
        this._cleanInfos ({
            infos : infos_cloned
        });
        // get
        var relations = this._getRelationFromInfos ({
            infos : infos_cloned ,
        });
        // get
        this._pushMultipleMapOrPushTemp ({
            model : model ,
            relations : relations ,
        });
        // watch
        this._watchTemp ();
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
    whoForeignWho (entity_1 , entity_2) {
        // get
        var map = this._getMap ();
        // default
        var entity = null;
        var related = null;
        var foreign = null;
        // loop
        for (var i in map) {
            for (var j in map[i].relations) {
                // control
                if (map[i].table == entity_1 && entity_2 == map[i].relations[j].table) {
                    entity = this._cloneData (map[i]);
                    foreign = {
                        key : map[i].relations[j].foreign ,
                        reference : map[i].relations[j].foreign_table ,
                        on : map[i].relations[j].on ,
                    };
                    related = this._cloneData (this.findModelByTable ({
                        table : entity_2
                    }));
                    break;
                }
                // control
                else if (map[i].table == entity_2 && entity_1 == map[i].relations[j].table) {
                    entity = this._cloneData (map[i]);
                    foreign = {
                        key : map[i].relations[j].foreign ,
                        reference : map[i].relations[j].foreign_table ,
                        on : map[i].relations[j].on ,
                    };
                    related = this._cloneData (this.findModelByTable ({
                        table : entity_1
                    }));
                    break;
                }
            }
        }
        // clean
        delete entity.relations;
        delete related.relations;
        // return
        return {
            entity : entity ,
            foreign : foreign ,
            related : related ,
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
    getColmuns (parameters) {
        // parameters
        var table = parameters.table;
        var next = parameters.next;
        // get
        var model = this.findModelByTable ({
            table : table
        });
        // control
        if (!model) {
            next ({
                columns : []
            });
        }
        // control
        if (model.columns.length) {
            next ({
                columns : model.columns
            });
        }
        // control
        else {
            // knex
            this.knex.raw ("SELECT * FROM information_schema.columns where table_schema = '" + this.knex_conf.connection.database + "' and table_name = '" + table + "'")
            .then ((results) => {
                // get
                var names = this._getValueByPath ({
                    match : "COLUMN_NAME" ,
                    datas : results
                });
                // default
                var columns = [];
                // loop
                for (var i in names) {
                    // model
                    var model_column = this._modelColumn ({
                        name : names[i]
                    });
                    // push
                    columns.push (model_column);
                }
                // set
                model.columns = columns;
                // next
                next ({
                    columns : columns
                });
            });
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
    _getRelationFromInfos (parameters) {
        // parameters
        var infos = parameters.infos;
        // default
        var relations = [];
        // loop
        for (var i in infos) {
            // extract
            var extracted = this._extractRelation ({
                relation : infos[i] ,
                alias : i
            });
            // push
            relations.push (extracted);
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
    _modelColumn (parameters) {
        // parameters
        var table = parameters.name;
        // return
        return {
            name : table
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
    _getIdAttribute (id) {
        // control
        if (!id) {
            id = "id";
        }
        // return
        return id;
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
    _watchTemp () {
        // get
        var temp = this._getTemp ();
        // loop
        for (var i in temp) {
            // push
            this._pushMapOrPushTemp (temp[i])
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
        var alias = parameters.alias;
        // default
        var model = false;
        // clean
        var string = this._cleanRelation (relation);
        // regex
        var regex = /(hasOne|hasMany|morphOne|morphTo|morphMany|belongsTo|belongsToMany)\((.*?)\)/;
        var matchs = string.match (regex);
        if (matchs != null) {
            // variable
            var type = matchs[1];
            var attributes = matchs[2].split (",");
            // model
            model = this._modelRelationExtracted ({
                alias : alias ,
                type : type ,
                attributes : attributes ,
            });
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
    _modelRelationExtracted (parameters) {
        // default
        var alias = "";
        var type = "";
        var attributes = "";
        // control
        if (parameters.hasOwnProperty ("alias")) {
            alias = parameters.alias;
        }
        // control
        if (parameters.hasOwnProperty ("type")) {
            type = parameters.type;
        }
        // control
        if (parameters.hasOwnProperty ("attributes")) {
            attributes = parameters.attributes;
        }
        // return
        return {
            alias : alias ,
            type : type ,
            attributes : attributes ,
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
    _modelRelation (parameters) {
        // default
        var model = "";
        var alias = "";
        var type = "";
        var foreign = "";
        var foreign_table = "";
        var table = "";
        var on = "";
        // control
        if (parameters.hasOwnProperty ("model")) {
            model = parameters.model;
        }
        // control
        if (parameters.hasOwnProperty ("alias")) {
            alias = parameters.alias;
        }
        // control
        if (parameters.hasOwnProperty ("type")) {
            type = parameters.type;
        }
        // control
        if (parameters.hasOwnProperty ("foreign")) {
            foreign = parameters.foreign;
        }
        // control
        if (parameters.hasOwnProperty ("foreign_table")) {
            foreign_table = parameters.foreign_table;
        }
        // control
        if (parameters.hasOwnProperty ("table")) {
            table = parameters.table;
        }
        // control
        if (parameters.hasOwnProperty ("on")) {
            on = parameters.on;
        }
        // return
        return {
            //model : model ,
            //alias : alias ,
            //type : type ,
            foreign : foreign ,
            foreign_table : foreign_table ,
            table : table ,
            on : on ,
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
    _modelMap (parameters) {
        // default
        var model = "";
        var table = "";
        var id = "";
        var relations = [];
        var columns = [];
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
            columns : columns ,
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
    _getTemp () {
        // return
        return this._temp;
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
        this._controlAndMergeTableDoublon ({
            map : value
        });
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
    _writeMap () {
        this.fs.writeFileSync (__dirname + "/sefmap.json" , JSON.stringify (this._getMap () , null , 4));
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
    _pushTemp (value) {
        this._temp.push (this._cloneData (value));
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
    _pushRelationOnModel (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].model == model) {
                // push
                map[i].relations.push (relation);
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
    _pushRelationOnTable (parameters) {
        // parameters
        var table = parameters.table;
        var relation = parameters.relation;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].table == table) {
                // push
                map[i].relations.push (relation);
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
    _controlAndMergeTableDoublon (parameters) {
        // parameters
        var map = parameters.map;
        // get
        var maps = this._getMap ();
        // loop
        for (var i in maps) {
            // control :: si la table existe
            if (maps[i].table == map.table) {
                // loop :: on boucle sur les relations
                for (var j in maps[i].relations) {
                    // control :: si les relation n'existe pas
                    var control = this._controlRelationOnTableExist ({
                        table : map.table ,
                        relation : maps[i].relations[j]
                    });
                    if (!control) {
                        // push :: on push les relations
                        this._pushRelationOnTable ({
                            table : map.table ,
                            relation : maps[i].relations[j]
                        });
                    }
                }
                // control :: si le model n'est pas vide
                if (maps[i].model == "" && map.model != "") {
                    // set :: on set le nom du model
                    maps[i].model = map.model;
                    // delete
                    maps.splice (i , 1);
                }
                break;
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
    _deleteRelationOnModel (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].model == model) {
                // loop
                for (var j in map[i].relations) {
                    // push
                    if (JSON.stringify (map[i].relations[j]) == JSON.stringify (relation)) {
                        map[i].relations.splice (j , 1);
                        break;
                    }
                }
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
    _deleteTemp (parameters) {
        // get
        var temp = this._getTemp ();
        // loop
        for (var i in temp) {
            // push
            if (JSON.stringify (parameters) == JSON.stringify (temp[i])) {
                temp.splice (i , 1);
                break;
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
    _controlTempExist (parameters) {
        // get
        var temp = this._getTemp ();
        // default
        var control = false;
        // loop
        for (var i in temp) {
            // push
            if (JSON.stringify (parameters) == JSON.stringify (temp[i])) {
                control = true;
                break;
            }
        }
        // return
        return control;
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
    _controlRelationOnTableExist (parameters) {
        // parameters
        var table = parameters.table;
        var relation = parameters.relation;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].table == table) {
                // loop
                for (var j in map[i].relations) {
                    // control
                    if (JSON.stringify (relation) == JSON.stringify (map[i].relations[j])) {
                        return true;
                    }
                }
            }
        }
        // return
        return false;
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
    _controlRelationOnModelExist (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].model == model) {
                // loop
                for (var j in map[i].relations) {
                    // control
                    if (JSON.stringify (relation) == JSON.stringify (map[i].relations[j])) {
                        return true;
                    }
                }
            }
        }
        // return
        return false;
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
    _pushMultipleMapOrPushTemp (parameters) {
        // parameters
        var relations = parameters.relations;
        var model = parameters.model;
        // loop
        for (var i in relations) {
            // push
            this._pushMapOrPushTemp ({
                model : model ,
                relation : relations[i]
            });
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
    _pushMapOrPushTemp (parameters) {
        // parameters
        var relation = parameters.relation;
        var model = parameters.model;
        // control
        if (relation.type == "hasOne") {
            this._hasOne ({
                relation : relation ,
                model : model
            });
        }
        // control
        else if (relation.type == "hasMany") {
            this._hasMany ({
                relation : relation ,
                model : model
            });
        }
        // control
        else if (relation.type == "belongsTo") {
            this._belongsTo ({
                relation : relation ,
                model : model
            });
        }
        // control
        else if (relation.type == "belongsToMany") {
            this._belongsToMany ({
                relation : relation ,
                model : model
            });
        }
        // control
        else if (relation.type == "morphOne") {
            this._morphOne ({
                relation : relation ,
                model : model
            });
        }
        // control
        else if (relation.type == "morphTo") {
            this._morphTo ({
                relation : relation ,
                model : model
            });
        }
        // control
        else if (relation.type == "morphMany") {
            this._morphMany ({
                relation : relation ,
                model : model
            });
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
    _hasOne (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // find
        var model_origine_found = this._findModelByModel ({
            model : model
        });
        // find
        var model_relation_found = this._findModelByModel ({
            model : relation.attributes[0]
        });
        // control :: si le model existe dans la map
        if (model_relation_found) {
            // get
            var foreign = this._getForeign ({
                index : 1 ,
                relation : relation ,
                model : model_origine_found
            });
            // model :: on créer un model relation
            var model_relation = this._modelRelation ({
                on : model_origine_found.id ,
                foreign : foreign ,
                table : model_origine_found.table ,
            });
            // control
            var control = this._controlRelationOnModelExist ({
                model : model_relation_found.model ,
                relation : model_relation ,
            });
            if (!control) {
                // on ajoute la relation au model trouver
                this._pushRelationOnModel ({
                    model : model_relation_found.model ,
                    relation : model_relation
                });
                // delete :: on supprime la relation du modelèe en cour
                this._deleteRelationOnModel ({
                    model : model ,
                    relation : relation ,
                });
            }
            // delete
            this._deleteTemp (parameters);
        }
        // control :: si le model n'existe pas dans la map
        else {
            // control
            if (!this._controlTempExist (parameters)) {
                // push temp
                this._pushTemp (parameters);
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
    _hasMany (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // find
        var model_origine_found = this._findModelByModel ({
            model : model
        });
        // find
        var model_relation_found = this._findModelByModel ({
            model : relation.attributes[0]
        });
        // control :: si le model existe dans la map
        if (model_relation_found) {
            // get
            var foreign = this._getForeign ({
                index : 1 ,
                relation : relation ,
                model : model_origine_found
            });
            // model :: on créer un model relation
            var model_relation = this._modelRelation ({
                on : model_origine_found.id ,
                foreign : foreign ,
                table : model_origine_found.table ,
            });
            // control
            var control = this._controlRelationOnModelExist ({
                model : model_relation_found.model ,
                relation : model_relation ,
            });
            if (!control) {
                // on ajoute la relation au model trouver
                this._pushRelationOnModel ({
                    model : model_relation_found.model ,
                    relation : model_relation
                });
                // delete :: on supprime la relation du modelèe en cour
                this._deleteRelationOnModel ({
                    model : model ,
                    relation : relation ,
                });
            }
            // delete
            this._deleteTemp (parameters);
        }
        // control :: si le model n'existe pas dans la map
        else {
            // push temp
            if (!this._controlTempExist (parameters)) {
                this._pushTemp (parameters);
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
    _belongsTo (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // find
        var model_relation_found = this._findModelByModel ({
            model : relation.attributes[0]
        });
        // control :: si le model existe dans la map
        if (model_relation_found) {
            // get
            var foreign = this._getForeign ({
                index : 1 ,
                relation : relation ,
                model : model_relation_found
            });
            // model :: on créer un model relation
            var model_relation = this._modelRelation ({
                on : model_relation_found.id ,
                foreign : foreign ,
                table : model_relation_found.table ,
            });
            // control
            var control = this._controlRelationOnModelExist ({
                model : model ,
                relation : model_relation ,
            });
            if (!control) {
                // on ajoute la relation au model trouver
                this._pushRelationOnModel ({
                    model : model ,
                    relation : model_relation
                });
                // delete :: on supprime la relation du modelèe en cour
                this._deleteRelationOnModel ({
                    model : model ,
                    relation : relation ,
                });
            }
            // delete
            this._deleteTemp (parameters);
        }
        // control :: si le model n'existe pas dans la map
        else {
            // push temp
            if (!this._controlTempExist (parameters)) {
                this._pushTemp (parameters);
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
    _belongsToMany (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // find
        var model_origine_found = this._findModelByModel ({
            model : model
        });
        // find
        var model_relation_found = this._findModelByModel ({
            model : relation.attributes[0]
        });
        // control :: si le model existe dans la map
        if (model_relation_found) {
            // get :: on récupère le nom de la table
            var table = this._getTable ({
                index : 1 ,
                relation : relation ,
                model_relation : model_relation_found ,
                model_origine : model_origine_found
            });
            // get :: on récupère le foreign du model origine
            var foreign_origine = this._getForeign ({
                index : 2 ,
                relation : relation ,
                model : model_origine_found
            });
            // get :: on récupère le foreign du model related
            var foreign_relation = this._getForeign ({
                index : 3 ,
                relation : relation ,
                model : model_relation_found
            });
            // model :: on créer le model relation pour l'origine
            var model_pivot_origine = this._modelRelation ({
                on : model_origine_found.id ,
                foreign : foreign_origine ,
                table : model_origine_found.table ,
            });
            // model :: on créer le model relation  pour le related
            var model_pivot_relation = this._modelRelation ({
                on : model_relation_found.id ,
                foreign : foreign_relation ,
                table : model_relation_found.table ,
            });
            // control :: si le model pivot existe deja on push les relation by table
            var control = this._controlTableExist ({
                table : table
            });
            if (control) {
                // control :: si la relation dans la table n'existe pas déjà
                var control = this._controlRelationOnTableExist ({
                    table : table ,
                    relation : model_pivot_origine
                });
                if (!control) {
                    this._pushRelationOnTable ({
                        table : table ,
                        relation : model_pivot_origine
                    });
                }
                // control :: si la relation dans la table n'existe pas déjà
                var control = this._controlRelationOnTableExist ({
                    table : table ,
                    relation : model_pivot_relation
                });
                if (!control) {
                    this._pushRelationOnTable ({
                        table : table ,
                        relation : model_pivot_relation
                    });
                }
            }
            //control :: sinon on créer le model et le push direct a map
            else {
                // model :: on créer le model map
                var model_map = this._modelMap ({
                    table : table ,
                    relations : [
                        model_pivot_origine ,
                        model_pivot_relation
                    ]
                });
                // push
                this._pushMap (model_map);
            }
            // delete :: on supprime la relation du modelèe en cour
            this._deleteRelationOnModel ({
                model : model ,
                relation : relation ,
            });
            // delete
            this._deleteTemp (parameters);
        }
        // control :: si le model n'existe pas dans la map
        else {
            // push temp
            if (!this._controlTempExist (parameters)) {
                this._pushTemp (parameters);
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
    _morphOne (parameters) {
        // parameters
        this._morphMany (parameters);
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
    _morphTo (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // omogeniser les attributes
        this._modelAttributesMorphTo ({
            attributes : relation.attributes ,
            index_type : 1 ,
        });
        // récupérer toute les relation possible
        var targets = this._morphToExtractTargets ({
            attributes : relation.attributes
        });
        // loop
        for (var i in targets) {
            // unique
            this._morphToUnique ({
                model : model ,
                relation : relation ,
                target : targets[i] ,
            });
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
    _morphToUnique (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        var target = parameters.target;
        // find
        var model_origine_found = this._findModelByModel ({
            model : model
        });
        // find
        var model_relation_found = this._findModelByModel ({
            model : target
        });
        // control :: si le model existe dans la map
        if (model_relation_found) {
            // get :: on récupère les clées polymorphe
            var foreign_polymorphe = this._getForeignPolymorphe ({
                relation : relation ,
                index : 0
            });
            var foreign = foreign_polymorphe.foreign;
            var foreign_table = foreign_polymorphe.foreign_table;
            // model :: on créer un model relation
            var model_relation = this._modelRelation ({
                on : model_relation_found.id ,
                foreign : foreign ,
                foreign_table : foreign_table ,
                table : model_relation_found.table ,
            });
            // control
            var control = this._controlRelationOnModelExist ({
                model : model ,
                relation : model_relation ,
            });
            if (!control) {
                // push
                this._pushRelationOnModel ({
                    model : model ,
                    relation : model_relation
                });
                // delete :: on supprime la relation du modelèe en cour
                this._deleteRelationOnModel ({
                    model : model ,
                    relation : relation ,
                });
            }
            // delete
            this._deleteTemp (parameters);
        }
        // control :: si le model n'existe pas dans la map
        else {
            // push temp
            if (!this._controlTempExist (parameters)) {
                this._pushTemp (parameters);
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
    _morphMany (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        // omogeniser les attributes
        this._modelAttributesMorphMany ({
            attributes : relation.attributes ,
            index_type : 2 ,
        });
        // find
        var model_origine_found = this._findModelByModel ({
            model : model
        });
        // find
        var model_relation_found = this._findModelByModel ({
            model : relation.attributes[0]
        });
        // control :: si le model existe dans la map
        if (model_relation_found) {
            // get :: on récupère les clées polymorphe
            var foreign_polymorphe = this._getForeignPolymorphe ({
                relation : relation ,
                index : 1
            });
            var foreign = foreign_polymorphe.foreign;
            var foreign_table = foreign_polymorphe.foreign_table;
            // model :: on créer un model relation
            var model_relation = this._modelRelation ({
                on : model_origine_found.id ,
                foreign : foreign ,
                foreign_table : foreign_table ,
                table : model_origine_found.table ,
            });
            // control
            var control = this._controlRelationOnModelExist ({
                model : model ,
                relation : model_relation ,
            });
            if (!control) {
                // push
                this._pushRelationOnModel ({
                    model : model_relation_found.model ,
                    relation : model_relation
                });
                // delete :: on supprime la relation du modelèe en cour
                this._deleteRelationOnModel ({
                    model : model ,
                    relation : relation ,
                });
            }
            // delete
            this._deleteTemp (parameters);
        }
        // control :: si le model n'existe pas dans la map
        else {
            // push temp
            if (!this._controlTempExist (parameters)) {
                this._pushTemp (parameters);
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
    _modelAttributesMorphTo (parameters) {
        // parameters
        var attributes = parameters.attributes;
        var index_type = parameters.index_type;
        // control
        if (attributes[index_type][0] != "[" && !Array.isArray (attributes[index_type])) {
            attributes.splice (1 , 0 , []);
        }
        // control
        else if (attributes[index_type][0] == "[" && !Array.isArray (attributes[index_type])) {
            attributes[index_type] = attributes[index_type].replace ("[" , "");
            attributes[(index_type + 1)] = attributes[(index_type + 1)].replace ("]" , "");
            attributes[index_type] = [
                '"' + attributes[index_type] + '"' ,
                '"' + attributes[(index_type + 1)] + '"'
            ].join (",");
            attributes.splice ((index_type + 1) , 1);
            attributes[index_type] = JSON.parse ("[" + attributes[index_type] + "]");
        }
        // default
        return attributes;
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
    _modelAttributesMorphMany (parameters) {
        // parameters
        var attributes = parameters.attributes;
        var index_type = parameters.index_type;
        // control
        if (!attributes.hasOwnProperty (index_type)) {
            attributes.splice (index_type , 0 , []);
        }
        else if (attributes.hasOwnProperty (index_type) && attributes[index_type][0] == "[") {
            attributes[index_type] = attributes[index_type].replace ("[" , "");
            attributes[(index_type + 1)] = attributes[(index_type + 1)].replace ("]" , "");
            attributes[index_type] = [
                '"' + attributes[index_type] + '"' ,
                '"' + attributes[(index_type + 1)] + '"'
            ].join (",");
            attributes.splice ((index_type + 1) , 1);
            attributes[index_type] = JSON.parse ("[" + attributes[index_type] + "]");
        }
        // default
        return attributes;
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
    _morphToCleanAttributes (parameters) {
        // parameters
        var attributes = parameters.attributes;
        // clone
        attributes = this._cloneData (attributes);
        // default
        // splice
        attributes.splice (2 , (attributes.length - 1));
        // return
        return attributes;
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
    _morphToExtractTargets (parameters) {
        // parameters
        var attributes = parameters.attributes;
        // clone
        attributes = this._cloneData (attributes);
        // default
        var targets = [];
        // loop
        for (var i in attributes) {
            if (i != 0 && i != 1) {
                targets.push (attributes[i])
            }
        }
        // return
        return targets;
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
    _findModelByModel (parameters) {
        // parameters
        var model = parameters.model;
        // default
        var found = false;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].model == model) {
                found = map[i];
                break;
            }
        }
        // return
        return found;
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
    findModelByTable (parameters) {
        // parameters
        var table = parameters.table;
        // default
        var found = false;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].table == table) {
                found = map[i];
                break;
            }
        }
        // return
        return found;
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
    _controlTableExist (parameters) {
        // parameters
        var table = parameters.table;
        // get
        var map = this._getMap ();
        // loop
        for (var i in map) {
            // control
            if (map[i].table == table) {
                return true;
            }
        }
        // return
        return false;
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
    _getForeign (parameters) {
        // parameters
        var model = parameters.model;
        var relation = parameters.relation;
        var index = parameters.index;
        // control :: si on a la foreign de renseigné
        if (relation.attributes.hasOwnProperty (index)) {
            var foreign = relation.attributes[index];
        }
        // control
        else {
            var table = model.table;
            table = table.replace (/s$/g , "");
            var foreign = table + "_id";
        }
        // return
        return foreign;
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
    _getForeignPolymorphe (parameters) {
        // parameters
        var relation = parameters.relation;
        var index = parameters.index;
        // default
        var foreign = "";
        var foreign_table = "";
        // control
        if (relation.attributes[(index + 1)].length) {
            foreign = relation.attributes[(index + 1)][1];
            foreign_table = relation.attributes[(index + 1)][0];
        }
        // control
        else {
            foreign = relation.attributes[index] + "_id";
            foreign_table = relation.attributes[index] + "_type";
        }
        // return
        return {
            foreign : foreign ,
            foreign_table : foreign_table
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
    _getTable (parameters) {
        // parameters
        var relation = parameters.relation;
        var index = parameters.index;
        var model_origine = parameters.model_origine;
        var model_relation = parameters.model_relation;
        // control :: si on a la table de renseigné
        if (relation.attributes.hasOwnProperty (index)) {
            var table = relation.attributes[index];
        }
        // control
        else {
            // variable
            var table_model_origine = model_origine.table;
            var table_model_relation = model_relation.table;
            // sort
            var n = table_model_origine.localeCompare (table_model_relation);
            // control :: si origine et avant relation
            if (n == -1) {
                var table = table_model_origine + "_" + table_model_relation;
            }
            // control
            else {
                var table = table_model_relation + "_" + table_model_origine;
            }
        }
        // return
        return table;
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

    /*
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     *  ...
     *
     * * * * * * * * * * * * * * * * * * * * * * * * * *
     *
     */
    _getValueByPath (parameter) {
        if (!parameter.hasOwnProperty ('debug')) {
            parameter.debug = false;
        }
        if (!parameter.hasOwnProperty ('path')) {
            parameter.path = 'origine';
        }
        if (!parameter.hasOwnProperty ('value')) {
            parameter.value = [];
        }
        if (!parameter.hasOwnProperty ('__OBJECT__')) {
            parameter.__OBJECT__ = JSON.parse (JSON.stringify (parameter.datas));
        }
        if (parameter.hasOwnProperty ('attribut')) {
            parameter.path += '.' + parameter.attribut;
        }
        var object = parameter.__OBJECT__;
        for (var attribut in object) {
            var match_default = 'origine.' + parameter.match;
            var match_current = (parameter.path + '.' + attribut).replace (/\.[0-9]+/g , '');
            var regex = new RegExp ("^" + match_current , "g");
            if (parameter.debug) {
                console.log ("[" + match_current + "] : [" + match_default + "] : " + (match_current == match_default) , " , regex : " + regex.test (match_default) , object[attribut]);
            }
            if (match_current == match_default) {
                parameter.value.push (object[attribut]);
                break;
            }
            if (regex.test (match_default)) {
                if (object[attribut] && typeof object[attribut] == "object") {
                    this._getValueByPath ({
                        debug : parameter.debug ,
                        __OBJECT__ : object[attribut] ,
                        path : parameter.path ,
                        attribut : attribut ,
                        match : parameter.match ,
                        value : parameter.value
                    });
                }
            }
        }
        return parameter.value;
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
    _cloneData (obj) {
        return JSON.parse (JSON.stringify (obj));
    }
}