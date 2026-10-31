Game.Adventure.Grid.findPath=function(x,y){if(gameData.mode!=='adventure')return null;return Game.Utils.path(gameData.adventure.plane,gameData.adventure.hero,{x,y})};
Game.Adventure.Grid.select=function(){gameData.adventure.selection.selected='hero'};
Game.Adventure.Grid.gridToCords=function(x,y){return[x-5.5,y-4.5]};
