/*	Copyright (c) 2015 Jean-Marc VIGLINO,
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc OpenLayers 3 Layer Switcher Control.
 * @require jQuery
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} Control options.
 *		- show_progress {boolean} show a progress bar on tile layers, default false
 *		- mouseover {boolean} show the panel on mouseover, default false
 *		- reordering {boolean} allow layer reordering, default true
 *		- trash {boolean} add a trash button to delete the layer, default false
 *		- oninfo {function} callback on click on info button, if none no info button is shown
 *		- extent {boolean} add an extent button to zoom to the extent of the layer
 *		- onextent {function} callback when click on extent, default fits view to extent
 *
 * Layers attributes that control the switcher
 *	- allwaysOnTop {boolean} true to force layer stay on top of the others while reordering, default false
 *	- displayInLayerSwitcher {boolean} display in switcher, default true
 *	- noSwitcherDelete {boolean} to prevent layer deletion (w. trash option), default false
 */
ol.control.LayerSwitcher = function(opt_options)
{	var options = opt_options || {};
	var self = this;
	this.dcount = 0;
	this.show_progress = options.show_progress;
	this.oninfo = (typeof (options.oninfo) == "function" ? options.oninfo: null);
	this.onextent = (typeof (options.onextent) == "function" ? options.onextent: null);
	this.hasextent = options.extent || options.onextent;
	this.hastrash = options.trash;
	this.reordering = (options.reordering!==false);

	var element;
	if (options.target)
	{	element = $("<div>").addClass(options.switcherClass || "ol-layerswitcher");
	}
	else
	{	element = $("<div>").addClass((options.switcherClass || 'ol-layerswitcher') +' ol-unselectable ol-control ol-collapsed');

		this.button = $("<button>")
					.on("touchstart", function(e)
					{	element.toggleClass("ol-collapsed");
						e.preventDefault();
						self.overflow();
					})
					.click (function()
					{	element.toggleClass("ol-forceopen").addClass("ol-collapsed");
						self.overflow();
					})
					.appendTo(element);
		if (options.mouseover)
		{	$(element).mouseleave (function(){ element.addClass("ol-collapsed"); })
				.mouseover(function(){ element.removeClass("ol-collapsed"); });
		}
		this.topv = $("<div>").addClass("ol-switchertopdiv")
			.click(function(){ self.overflow("+50%"); })
			.appendTo(element);
		this.botv = $("<div>").addClass("ol-switcherbottomdiv")
			.click(function(){ self.overflow("-50%"); })
			.appendTo(element);
	}
	this.panel_ = $("<ul>").addClass("panel")
				.appendTo(element);
	this.panel_.on ('mousewheel DOMMouseScroll onmousewheel', function(e)
		{	if (self.overflow(Math.max(-1, Math.min(1, (e.originalEvent.wheelDelta || -e.originalEvent.detail)))))
			{	e.stopPropagation();
				e.preventDefault();
			}
		});
	this.header_ = $("<li>").addClass("ol-header").appendTo(this.panel_);

	ol.control.Control.call(this,
	{	element: element.get(0),
		target: options.target
	});

	// Enable jQuery dataTransfert
	// $.event.props.push('dataTransfer');
	this.target = options.target;

};
ol.inherits(ol.control.LayerSwitcher, ol.control.Control);


/** List of tips
*/
ol.control.LayerSwitcher.prototype.tip =
{	up: "up/down",
	down: "down",
	info: "information...",
	extent: "zoom to extent",
	trash: "remove layer",
	plus: "expand/shrink"
}

/**
 * Set the map instance the control is associated with.
 * @param {ol.Map} map The map instance.
 */
ol.control.LayerSwitcher.prototype.setMap = function(map)
{   ol.control.Control.prototype.setMap.call(this, map);
	this.drawPanel();

	if (this.map_)
	{	this.map_.getLayerGroup().un('change', this.drawPanel, this);
		this.map_.un('moveend', this.viewChange, this);
		this.map_.un('change:size', this.overflow, this);
		// console.log("remove");
	}

	this.map_ = map;
	// Get change (new layer added or removed)
	if (map)
	{	map.getLayerGroup().on('change', this.drawPanel, this);
		map.on('moveend', this.viewChange, this);
		map.on('change:size', this.overflow, this);
	}
};

/** Add a custom header

*/
ol.control.LayerSwitcher.prototype.setHeader = function(html)
{	this.header_.html(html);
};

/** Calculate overflow and add scrolls
*	@param {-1|0|1|+50%|-50%} dir scroll direction
*/
ol.control.LayerSwitcher.prototype.overflow = function(dir)
{
	if (this.button)
	{	// Nothing to show
		if (this.panel_.css('display')=='none')
		{	$(this.element).css("height", "auto");
			return;
		}
		// Calculate offset
		var h = $(this.element).outerHeight();
		var hp = this.panel_.outerHeight();
		var dh = this.button.position().top + this.button.outerHeight(true);
		var top = this.panel_.position().top-dh;
		if (hp > h-dh)
		{	// Bug IE: need to have an height defined
			$(this.element).css("height", "100%");
			switch (dir)
			{	case 1: top += 2*$("li",this.panel_).height(); break;
				case -1: top -= 2*$("li",this.panel_).height(); break;
				case "+50%": top += Math.round(h/2); break;
				case "-50%": top -= Math.round(h/2); break;
				default: break;
			}
			// Scroll div
			if (top+hp <= h-3*dh/2)
			{	top = h-3*dh/2-hp;
				this.botv.hide();
			}
			else
			{	this.botv.css("display","");//show();
			}
			if (top >= 0)
			{	top = 0;
				this.topv.hide();
			}
			else
			{	this.topv.css("display","");
			}
			// Scroll ?
			this.panel_.css('top', top+"px");
			return true;
		}
		else
		{	$(this.element).css("height", "auto");
			this.panel_.css('top', "0px");
			this.botv.hide();
			this.topv.hide();
			return false;
		}
	}
	else return false;
}

/**
 * On view change hide layer depending on resolution / extent
 * @param {ol.event} map The map instance.
 * @private
 */
ol.control.LayerSwitcher.prototype.viewChange = function(e)
{
	var map = this.map_;
	var res = this.map_.getView().getResolution();
	$("li", this.panel_).each(function()
	{	var l = $(this).data('layer');
		if (l)
		{	if (l.getMaxResolution()<=res || l.getMinResolution()>=res) $(this).addClass("ol-layer-hidden");
			else
			{	var ex0 = l.getExtent();
				if (ex0)
				{	var ex = map.getView().calculateExtent(map.getSize());
					if (!ol.extent.intersects(ex, ex0))
					{	$(this).addClass("ol-layer-hidden");
					}
					else $(this).removeClass("ol-layer-hidden");
				}
				else $(this).removeClass("ol-layer-hidden");
			}
		}
	});
}

/**
 *	Draw the panel control (prevent multiple draw due to layers manipulation on the map with a delay function)
 */
ol.control.LayerSwitcher.prototype.drawPanel = function(e)
{
	if (!this.getMap()) return;
	var self = this;
	// Multiple event simultaneously / draw once => put drawing in the event queue
	this.dcount++;
	setTimeout (function(){ self.drawPanel_(); }, 0);
}

/** Delayed draw panel control
 * @private
 */
ol.control.LayerSwitcher.prototype.drawPanel_ = function(e)
{	if (--this.dcount || this.dragging_) return;
	$("li", this.panel_).not(".ol-header").remove();
	this.drawList (this.panel_, this.getMap().getLayers());
}

/** Change layer visibility according to the baselayer option
 * @param {ol.layer}
 * @param {Array{ol.layer}} related layers
 */
ol.control.LayerSwitcher.prototype.switchLayerVisibility = function(l, layers)
{
//Modified by EB 28/01/17
	l.setVisible(!l.getVisible());

//	if (!l.get('baseLayer')) l.setVisible(!l.getVisible());
//	else
//	{
//		if (!l.getVisible()) l.setVisible(true);
//		layers.forEach(function(li)
//
//		{	if (l!==li && li.get('baseLayer') && li.getVisible()) li.setVisible(false);
//		});
//	}
//
}

/** Check if layer is on the map (depending on zoom and extent)
 * @param {ol.layer}
 * @return {boolean}
 */
ol.control.LayerSwitcher.prototype.testLayerVisibility = function(layer)
{
	if (this.map_)
	{	var res = this.map_.getView().getResolution();
		if (layer.getMaxResolution()<=res || layer.getMinResolution()>=res) return false;
		else
		{	var ex0 = layer.getExtent();
			if (ex0)
			{	var ex = this.map_.getView().calculateExtent(this.map_.getSize());
				return ol.extent.intersects(ex, ex0);
			}
			return true;
		}
	}
	return true;
};


/** Start ordering the list
*	@param {event} e drag event
*	@private
*/
ol.control.LayerSwitcher.prototype.dragOrdering_ = function(e)
{	var drag = e.data;
	switch (e.type)
	{	// Start ordering
		case 'mousedown':
		case 'touchstart':
		{	e.stopPropagation();
			//e.preventDefault();
			drag =
				{	self: drag.self,
					elt: $(e.currentTarget).closest("li"),
					start: true,
					element: drag.self.element,
					panel: drag.self.panel_,
					pageY: e.pageY || e.originalEvent.touches[0].pageY
				};
			drag.elt.parent().addClass('drag');
			$(document).on("mouseup mousemove touchend touchcancel touchmove", drag, drag.self.dragOrdering_);
			break;
		}
		// Stop ordering
		case 'touchcancel':
		case 'touchend':
		case 'mouseup':
		{	if (drag.target)
			{	// Get drag on parent
				var drop = drag.layer;
				var target = drag.target;
				if (drop && target)
				{	var collection ;
					if (drag.group) collection = drag.group.getLayers();
					else collection = drag.self.getMap().getLayers();
					var layers = collection.getArray();
					// Switch layers
					for (var i=0; i<layers.length; i++)
					{	if (layers[i]==drop)
						{	collection.removeAt (i);
							break;
						}
					}
					for (var j=0; j<layers.length; j++)
					{	if (layers[j]==target)
						{	if (i>j) collection.insertAt (j,drop);
							else collection.insertAt (j+1,drop);
							break;
						}
					}
				}
			}

			$("li",drag.elt.parent()).removeClass("dropover");
			drag.elt.removeClass("drag");
			drag.elt.parent().removeClass("drag");
			$(drag.element).removeClass('drag');
			if (drag.div) drag.div.remove();

			$(document).off("mouseup mousemove touchend touchcancel touchmove", drag.self.dragOrdering_);
			break;
		}
		// Ordering
		default:
		{	// First drag (more than 2 px) => show drag element (ghost)
			if (drag.start && Math.abs(drag.pageY - (e.pageY || e.originalEvent.touches[0].pageY)) > 2)
			{	drag.start = false;
				drag.elt.addClass("drag");
				drag.layer = drag.elt.data('layer');
				drag.target = false;
				drag.group = drag.elt.parent().parent().data('layer');
				// Ghost div
				drag.div = $("<li>").appendTo(drag.panel);
				drag.div.css ({ position: "absolute", "z-index":10000, left:drag.elt.position().left, opacity:0.5 })
						.html($(drag.elt).html())
						.addClass("ol-dragover")
						.width(drag.elt.outerWidth())
						.height(drag.elt.height());
				$(drag.element).addClass('drag');
			}
			if (!drag.start)
			{	e.preventDefault();
				e.stopPropagation();

				// Ghost div
				drag.div.css ({ top:(e.pageY || e.originalEvent.touches[0].pageY)-drag.panel.offset().top+5 });

				var li;
				if (e.pageX) li = $(e.target);
				else li = $(document.elementFromPoint(e.originalEvent.touches[0].clientX, e.originalEvent.touches[0].clientY));
				if (li.hasClass("ol-switcherbottomdiv"))
				{	drag.self.overflow(-1);
				}
				else if (li.hasClass("ol-switchertopdiv"))
				{	drag.self.overflow(1);
				}
				if (!li.is("li")) li = li.closest("li");
				if (!li.hasClass('dropover')) $("li", drag.elt.parent()).removeClass("dropover");
				if (li.parent().hasClass('drag') && li.get(0) !== drag.elt.get(0))
				{	var target = li.data("layer");
					// Don't mix layer level
					if (target && !target.get("allwaysOnTop") == !drag.layer.get("allwaysOnTop"))
					{	li.addClass("dropover");
						drag.target = target;
					}
					else
					{	drag.target = false;
					}
					drag.div.show();
				}
				else
				{	drag.target = false;
					if (li.get(0) === drag.elt.get(0)) drag.div.hide();
					else drag.div.show();
				}

				if (!drag.target) drag.div.addClass("forbidden");
				else drag.div.removeClass("forbidden");
			}
			break;
		}
	}
};


/** Change opacity on drag
*	@param {event} e drag event
*	@private
*/
ol.control.LayerSwitcher.prototype.dragOpacity_ = function(e)
{	var drag = e.data;
	switch (e.type)
	{	// Start opacity
		case 'mousedown':
		case 'touchstart':
		{	e.stopPropagation();
			e.preventDefault();
			drag.start = e.pageX || e.originalEvent.touches[0].pageX;
			drag.elt = $(e.target);
			drag.layer = drag.elt.closest("li").data('layer')
			drag.self.dragging_ = true;
			$(document).on("mouseup touchend mousemove touchmove touchcancel", drag, drag.self.dragOpacity_);
			break;
		}
		// Stop opacity
		case 'touchcancel':
		case 'touchend':
		case 'mouseup':
		{	$(document).off("mouseup touchend mousemove touchmove touchcancel", drag.self.dragOpacity_);
			drag.layer.setOpacity(drag.opacity);
			drag.self.dragging_ = false;
			drag = false;
			break;
		}
		// Move opacity
		default:
		{	var x = e.pageX || e.originalEvent.touches[0].pageX;
			var dx = Math.max ( 0, Math.min( 1, (x - drag.elt.parent().offset().left) / drag.elt.parent().width() ));
			drag.elt.css("left", (dx*100)+"%");
			drag.opacity = dx;
			drag.layer.setOpacity(dx);
//added by EB 23/01/17
			var prefix = drag.layer.get("title");
			document.getElementById(prefix + '_opacity').value = (Math.round(drag.opacity*100)/100)*100 + '%';

			var op1 = document.getElementById('Remoteness' + '_opacity').value;
			var op2 = document.getElementById('Ruggedness' + '_opacity').value;
			var op3 = document.getElementById('Absence' + '_opacity').value;
			var op4 = document.getElementById('Naturalness' + '_opacity').value;
			var	op1n = Number(op1.slice(0, -1));
			var	op2n = Number(op2.slice(0, -1));
			var	op3n = Number(op3.slice(0, -1));
			var	op4n = Number(op4.slice(0, -1));
			var	op_total = op1n + op2n + op3n + op4n;
			document.getElementById('Remoteness' + '_weight').value = Math.round((op1n/op_total)*100)/100;
			document.getElementById('Ruggedness' + '_weight').value = Math.round((op2n/op_total)*100)/100;
			document.getElementById('Absence' + '_weight').value = Math.round((op3n/op_total)*100)/100;
			document.getElementById('Naturalness' + '_weight').value = Math.round((op4n/op_total)*100)/100;
//
			break;
		}
	}
}

//added by EB 23/01/17
ol.control.LayerSwitcher.prototype.clickOpacity_ = function(e)
{
		var click = e.data;
		e.stopPropagation();
		e.preventDefault();
		click.elt = $(e.target);
		click.layer = click.elt.closest("li").data('layer');
		click.self.dragging_ = true;
		var x = e.pageX || e.originalEvent.touches[0].pageX;
		var dx = Math.max ( 0, Math.min( 1, (x - click.elt.offset().left) / click.elt.width() ));
		click.elt.children().css("left", (dx*100)+"%");
		click.opacity = dx;
		click.layer.setOpacity(dx);

		var prefix = click.layer.get("title");
		document.getElementById(prefix + '_opacity').value = (Math.round(click.opacity*100)/100)*100 + '%';

			var op1 = document.getElementById('Remoteness' + '_opacity').value;
			var op2 = document.getElementById('Ruggedness' + '_opacity').value;
			var op3 = document.getElementById('Absence' + '_opacity').value;
			var op4 = document.getElementById('Naturalness' + '_opacity').value;
			var	op1n = Number(op1.slice(0, -1));
			var	op2n = Number(op2.slice(0, -1));
			var	op3n = Number(op3.slice(0, -1));
			var	op4n = Number(op4.slice(0, -1));
			op_total = op1n + op2n + op3n + op4n;
			document.getElementById('Remoteness' + '_weight').value = Math.round((op1n/op_total)*100)/100;
			document.getElementById('Ruggedness' + '_weight').value = Math.round((op2n/op_total)*100)/100;
			document.getElementById('Absence' + '_weight').value = Math.round((op3n/op_total)*100)/100;
			document.getElementById('Naturalness' + '_weight').value = Math.round((op4n/op_total)*100)/100;
}
//

/** Render a list of layer
 * @param {elt} element to render
 * @layers {Array{ol.layer}} list of layer to show
 * @api stable
 */
ol.control.LayerSwitcher.prototype.drawList = function(ul, collection)
{	var self = this;
	var layers = collection.getArray();
//Added by EB 24/01/17
	var	op1n = 25;
	var	op2n = 25;
	var	op3n = 25;
	var	op4n = 25;
	op_total = op1n + op2n + op3n + op4n;
//
	var setVisibility = function(e)
	{
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).parent().parent().data("layer");
		self.switchLayerVisibility(l,collection);
	};
	function moveLayer (l, layers, inc)
	{
		for (var i=0; i<layers.getLength(); i++)
		{	if (layers.item(i) === l)
			{	layers.remove(l);
				layers.insertAt(i+inc, l);
				return true;
			}
			if (layers.item(i).getLayers && moveLayer (l, layers.item(i).getLayers(), inc)) return true;
		}
		return false;
	};
	function moveLayerUp(e)
	{	e.stopPropagation();
		e.preventDefault();
		moveLayer($(this).closest('li').data("layer"), self.map_.getLayers(), +1);
	};
	function moveLayerDown(e)
	{	e.stopPropagation();
		e.preventDefault();
		moveLayer($(this).closest('li').data("layer"), self.map_.getLayers(), -1);
	};
	function onInfo(e)
	{	e.stopPropagation();
		e.preventDefault();
		self.oninfo($(this).closest('li').data("layer"));
	};
	function zoomExtent(e)
	{	e.stopPropagation();
		e.preventDefault();
		if (self.onextent) self.onextent($(this).closest('li').data("layer"));
		else self.map_.getView().fit ($(this).closest('li').data("layer").getExtent(), self.map_.getSize());
	};
	function removeLayer(e)
	{	e.stopPropagation();
		e.preventDefault();
		var li = $(this).closest("ul").parent();
		if (li.data("layer"))
		{	li.data("layer").getLayers().remove($(this).closest('li').data("layer"));
			if (li.data("layer").getLayers().getLength()==0) removeLayer.call($(".layerTrash", li), e);
		}
		else self.map_.removeLayer($(this).closest('li').data("layer"));
	};

	// Add the layer list
	for (var i=layers.length-1; i>=0; i--)
	{	var layer = layers[i];
		if (layer.get("displayInLayerSwitcher")===false) continue;

		var li = $("<li>").addClass((layer.getVisible()?"visible ":" ")+(layer.get('baseLayer')?"baselayer":""))
						.data("layer",layer).appendTo(ul);

//Added by EB 28/01/17
		if (layer.get("title") === "Base Layers"){
			//$("<div>").addClass("ol-separator").appendTo(li);
			$("<hr>").addClass("ol-separator").appendTo(li)
		}
//

		var layer_buttons = $("<div>").addClass("ol-layerswitcher-buttons").appendTo(li);

		var d = $("<div>").addClass('li-content').appendTo(li);
		if (!this.testLayerVisibility(layer)) d.addClass("ol-layer-hidden");

		// Visibility
//Modified by EB 28/01/17
		if (layer.get("title") !== "Base Layers"){
			$("<input>")
			.attr('type', 'checkbox')
			.attr("checked",layer.getVisible())
			.on ('click', setVisibility)
			.appendTo(d);
		}
//
		// Label
		$("<label>").text(layer.get("title") || layer.get("name"))
			.attr('title', layer.get("title") || layer.get("name"))
			.on ('click', setVisibility)
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false)
			.appendTo(d);

		//  up/down
		if (this.reordering)
		{	if ( (i<layers.length-1 && (layer.get("allwaysOnTop") || !layers[i+1].get("allwaysOnTop")) )
				|| (i>0 && (!layer.get("allwaysOnTop") || layers[i-1].get("allwaysOnTop")) ) )
			{
//Modified by EB 28/01/17
				if (layer.get("title") !== "Base Layers"){
					$("<div>").addClass("layerup")
						.on ("mousedown touchstart", {self:this}, this.dragOrdering_ )
						.attr("title", this.tip.up)
						.appendTo(layer_buttons);
				}
//
			}
		}

		// Show/hide sub layers
		if (layer.getLayers)
		{	var nb = 0;
			layer.getLayers().forEach(function(l)
			{	if (l.get('displayInLayerSwitcher')!==false) nb++;
			});
			if (nb)
			{
				$("<div>").addClass(layer.get("openInLayerSwitcher") ? "collapse-layers" : "expend-layers" )
					.click(function()
					{	var l = $(this).closest('li').data("layer");
						l.set("openInLayerSwitcher", !l.get("openInLayerSwitcher") )
					})
					.attr("title", this.tip.plus)
					.appendTo(layer_buttons);
			}
		}

		// $("<div>").addClass("ol-separator").appendTo(layer_buttons);

		// Info button
		if (this.oninfo)
		{	$("<div>").addClass("layerInfo")
					.on ('click', onInfo)
					.attr("title", this.tip.info)
					.appendTo(layer_buttons);
		}
		// Layer remove
		if (this.hastrash && !layer.get("noSwitcherDelete"))
		{	$("<div>").addClass("layerTrash")
					.on ('click', removeLayer)
					.attr("title", this.tip.trash)
					.appendTo(layer_buttons);
		}
		// Layer extent
		if (this.hasextent && layers[i].getExtent())
		{	var ex = layers[i].getExtent();
			if (ex.length==4 && ex[0]<ex[2] && ex[1]<ex[3])
			{	$("<div>").addClass("layerExtent")
					.on ('click', zoomExtent)
					.attr("title", this.tip.extent)
					.appendTo(layer_buttons);
			}
		}

		// Progress
		if (this.show_progress && layer instanceof ol.layer.Tile)
		{	var p = $("<div>")
				.addClass("layerswitcher-progress")
				.appendTo(d);
			this.setprogress_(layer);
			layer.layerswitcher_progress = $("<div>").appendTo(p);
		}

		// Opacity
//Modified by EB 28/01/17
		if (layer.get("title") !== "Base Layers"){
			var opacity = $("<div>").addClass("layerswitcher-opacity")
				.on("mousedown", { self: this }, self.clickOpacity_ )
				.appendTo(d);

			$("<div>").addClass("layerswitcher-opacity-cursor")
				.on("mousedown touchstart", { self: this }, self.dragOpacity_ )
				.css ('left', (layer.getOpacity()*100)+"%")
				.appendTo(opacity);
		}
//

//added by EB 24/01/17
		if (layer.get("title") === "Remoteness"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);

			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_weight')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round((op1n/op_total)*100)/100))
			.appendTo(d);
		}
		else if (layer.get("title") === "Ruggedness"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);

			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_weight')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round((op2n/op_total)*100)/100))
			.appendTo(d);
		}
		else if (layer.get("title") === "Absence"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);

			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_weight')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round((op3n/op_total)*100)/100))
			.appendTo(d);
		}
		else if (layer.get("title") === "Naturalness"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);

			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_weight')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round((op4n/op_total)*100)/100))
			.appendTo(d);
		}
		//Modified by EB 28/01/21
		else if (layer.get("title") === "OS"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);
		}
		else if (layer.get("title") === "SNH Wildness"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);
		}
		else if (layer.get("title") === "SNH Wild Land"){
			$("<input>")
			.attr('type', 'text')
			.attr('id', layer.get("title") + '_opacity')
			.attr('disabled', 'true')
			.attr('size', '2')
			.attr('value', (Math.round(layer.getOpacity()*100)/100)*100 + '%')
			.appendTo(d);
		}

//

		// Layer group
		if (layer.getLayers)
		{	if (layer.get("openInLayerSwitcher")===true)
			{	this.drawList ($("<ul>").appendTo(li), layer.getLayers());
			}
		}
	}

	if (ul==this.panel_) this.overflow();
};

/** Handle progress bar for a layer
*	@private
*/
ol.control.LayerSwitcher.prototype.setprogress_ = function(layer)
{
	if (!layer.layerswitcher_progress)
	{	var loaded = 0;
		var loading = 0;
		function draw()
		{	if (loading === loaded)
			{	loading = loaded = 0;
				layer.layerswitcher_progress.width(0);
			}
			else
			{	layer.layerswitcher_progress.css('width', (loaded / loading * 100).toFixed(1) + '%');
			}
		}
		layer.getSource().on('tileloadstart', function()
		{	loading++;
			draw();
		});
		layer.getSource().on('tileloadend', function()
		{	loaded++;
			draw();
		});
		layer.getSource().on('tileloaderror', function()
		{	loaded++;
			draw();
		});
	}
}