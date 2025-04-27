// ==UserScript==
// @name			AO Tools
// @namespace		aktuerk_brothers
// @include         http*://cncapp*.alliances.commandandconquer.com/*/index.aspx*
// @include			http*://prodgame*.alliances.commandandconquer.com/*/index.aspx*
// @description		Developer guide
// @version			1.0.0
// @grant			none
// @icon			http://eaassets-a.akamaihd.net/cncalliancesweb/static/2.1/theme/cca-home-redux-theme/images/global/logo.png
// @contributor     Aktuerk Brohters
// ==/UserScript==

(function () {

    const AoTools = document.createElement("script");
    // script start
    var AoTools_main = function () {
        try {
            function createAoTools() {
                console.log("createAoTools");

                qx.Class.define("AoTools.Main", {
                    type: "singleton", extend: qx.core.Object, members: {
                        worldName: "null", worldId: 0, totalCreditProduction: 0,

                        initialize: function () {
                            let app = AoTools.Main.getInstance();
                            let server = ClientLib.Data.MainData.GetInstance().get_Server();

                            app.worldId = server.get_WorldId();
                            app.worldName = server.get_Name();


                            AoTools.Main.getInstance().service.startIntervalCollectInformationAndSendToServer();
                        },
                        API: {
                            POST: async (data) => {
                                try {
                                    const response = await fetch('https://hip-robin-active.ngrok-free.app/api/input', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(data)
                                    });

                                    if (!response.ok) {
                                        throw new Error(`HTTP error! Status: ${response.status}`);
                                    }

                                    const result = await response.json();
                                    console.log('Erfolg:', result);
                                    return result;
                                } catch (error) {
                                    console.error('Fehler beim Senden der Daten:', error);
                                }
                            }

                        },
                        service: {
                            startIntervalCollectInformationAndSendToServer: () => {
                                setInterval(() => {
                                    let app = AoTools.Main.getInstance();
                                    app.service.updateCreditProduction();
                                    let list = app.player.readAllProductionAndBonusInformationFromUserBases();

                                    list.map(city => {
                                        let value = app.city.readCityOffAndDefStateByCityId(city.id);
                                        city.off = value.off;
                                        city.def = value.def;
                                    })


                                    let information = {
                                        worldId: app.worldId,
                                        worldName: app.worldName,
                                        date: Date.now(),
                                        researchPoints: app.player.getResearchPoints(),
                                        credits: app.player.getTotalCredits(),
                                        creditProductionAllBases: app.totalCreditProduction,
                                        alliance: {
                                            id: app.alliance.getAllianceId(),
                                            rank: app.alliance.getAllianceRank(),
                                            name: app.alliance.getAllianceName(),
                                            score: app.alliance.getAllianceTotalScore(),
                                        },
                                        cities: list,
                                        player: app.player.getPlayerName(),
                                        rank: app.player.getGlobalPlayerRank(),
                                        controlHubCode: app.player.getHasControlHubCode()
                                    }
                                    app.API.POST(information);

                                }, 1000 * 60 *2);

                            },

                            updateCreditProduction: () => {
                                let cities = ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d;
                                let app = AoTools.Main.getInstance();
                                //.GetResourceGrowPerHour(ClientLib.Base.EResourceType.Gold) + city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Gold)

                                for (let key in cities) {
                                    let city = cities[key];
                                    app.totalCreditProduction = city.GetResourceGrowPerHour(ClientLib.Base.EResourceType.Gold) + city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Gold)
                                }
                            }
                        },

                        city: {
                            /**
                             * Read City Off and Def by ID
                             * @param cityId
                             * @returns {{off: number, def: number}}
                             */
                            readCityOffAndDefStateByCityId: (cityId) => {
                                return {
                                    off: ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d[cityId].get_LvlOffense(),
                                    def: ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d[cityId].get_LvlDefense()
                                }
                            }
                        },

                        player: {
                            /**
                             * read production information from user bases.
                             * @returns {Array<{
                             *     id: number,
                             *     name : string,
                             *     production : {
                             *         tiberium : number,
                             *         crystal : number,
                             *         power : number
                             *     },
                             *     resource : {
                             *         tiberium : number,
                             *         crystal : number,
                             *         power : number
                             *     }
                             * }>}
                             */
                            readAllProductionAndBonusInformationFromUserBases: () => {
                                let poi = AoTools.Main.getInstance().alliance.readPOIBonus();
                                let cities = ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d;
                                let returnData = [];

                                for (let key in cities) {
                                    let city = cities[key]
                                    returnData.push({
                                        id: key,
                                        name: city.m_SupportDedicatedBaseName,
                                        production: {
                                            tiberium: city.GetResourceGrowPerHour(ClientLib.Base.EResourceType.Tiberium) + city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Tiberium) + poi.tiberium,
                                            crystal: city.GetResourceGrowPerHour(ClientLib.Base.EResourceType.Crystal) + city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Crystal) + poi.crystal,
                                            power: city.GetResourceGrowPerHour(ClientLib.Base.EResourceType.Power) + city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Power) + poi.power,
                                            //credit: city.GetResourceGrowPerHour(ClientLib.Base.EResourceType.Gold) + city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Gold),

                                        },
                                        resource: {
                                            tiberium: city.GetResourceCount(ClientLib.Base.EResourceType.Tiberium),
                                            crystal: city.GetResourceCount(ClientLib.Base.EResourceType.Crystal),
                                            power: city.GetResourceCount(ClientLib.Base.EResourceType.Power),

                                        }
                                    });
                                }

                                return returnData;
                            }, /**
                             * not in use
                             * @returns {*[]}
                             */
                            readAllBonusProductionInformationFromUserBase: () => {
                                let cities = ClientLib.Data.MainData.GetInstance().get_Cities().get_AllCities().d;
                                let returnData = [];
                                for (let key in cities) {
                                    let city = cities[key]
                                    returnData.push({
                                        tiberium: city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Tiberium),
                                        crystal: city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Crystal),
                                        power: city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Power),
                                        //credit: city.GetResourceBonusGrowPerHour(ClientLib.Base.EResourceType.Gold),
                                    });
                                }

                                return returnData;
                            }, /**
                             * Read global Player Rank
                             * @returns {number}
                             */
                            getGlobalPlayerRank: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Player().get_OverallRank();
                            },

                            /**
                             * Player name
                             * @returns {string}
                             */
                            getPlayerName: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Player().get_Name();
                            },
                            /**
                             * get total Research Points
                             * @returns {number}
                             */
                            getResearchPoints: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Player().get_ResearchPoints()
                            },
                            /**
                             * Return total Cash information
                             * @returns {number}
                             */
                            getTotalCredits: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Player().GetCreditsCount();
                            },
                            /**
                             * value for ControlHubCode false = no, true = yes
                             * @returns {boolean}
                             */
                            getHasControlHubCode: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Player().get_HasControlHubCode();
                            },
                        },
                        alliance: {
                            /**
                             *
                             * @returns {{tiberium: number, crystal: number, power: number}}
                             */
                            readPOIBonus: () => {
                                let alliance = ClientLib.Data.MainData.GetInstance().get_Alliance();
                                return {
                                    tiberium: alliance.GetPOIBonusFromResourceType(ClientLib.Base.EResourceType.Tiberium),
                                    crystal: alliance.GetPOIBonusFromResourceType(ClientLib.Base.EResourceType.Crystal),
                                    power: alliance.GetPOIBonusFromResourceType(ClientLib.Base.EResourceType.Power),
                                    //credit: 0
                                }
                            }, /**
                             * Read Alliance Name
                             * @returns {string}
                             */
                            getAllianceName: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Alliance().get_Name();
                            }, /**
                             * Read Alliance Name
                             * @returns {string}
                             */
                            getAllianceTotalScore: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Alliance().get_TotalScore()
                            }, /**
                             * read Alliance Rank
                             * @returns {string}
                             */
                            getAllianceRank: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Alliance().get_Rank();
                            }, /**
                             * read Alliance ID
                             * @returns {number}
                             */
                            getAllianceId: () => {
                                return ClientLib.Data.MainData.GetInstance().get_Player().get_AllianceId();
                            }
                        },

                        world: {
                            readWorldInformationAroundPlayer: () => {
                                let world = ClientLib.Net.CommunicationManager.GetInstance().JFFAAN.d.PLAYER.i[0].o.KDFGWD.i
                            }
                        }
                    }
                })

            }


        } catch (e) {
            console.log("createAoTools: ", e);
        }

        //  create main script and check if Browser game ready.
        function AoTools_checkIfLoaded() {
            try {
                console.log("AoTools_checkIfLoaded()");
                if (typeof qx != 'undefined' && qx.core.Init.getApplication() && qx.core.Init.getApplication().getUIItem(ClientLib.Data.Missions.PATH.BAR_NAVIGATION) && qx.core.Init.getApplication().getUIItem(ClientLib.Data.Missions.PATH.BAR_NAVIGATION).isVisible()) {
                    createAoTools();

                    AoTools.Main.getInstance();
                    window.AoTools.Main.getInstance().initialize();
                } else {
                    window.setTimeout(AoTools_checkIfLoaded, 1000);
                }
            } catch (e) {
                console.log("AoTools_checkIfLoaded:", e)
            }
        }

        // intervall for start script
        if (/commandandconquer\.com/i.test(document.domain)) {
            window.setTimeout(AoTools_checkIfLoaded, 1000);
        }

    }


    // ------------- ab hier wird nicht mehr benutztten bindet den script ein -------
    try {
        console.log("AO Tools init");
        AoTools.textContent = "(" + AoTools_main.toString() + ")();";
        AoTools.type = "text/javascript";
        if (/commandandconquer\.com/i.test(document.domain)) {
            document.getElementsByTagName("head")[0].appendChild(AoTools);
        }
    } catch (e) {
        console.log("ao_tools: init error: ", e);
    }
})();


