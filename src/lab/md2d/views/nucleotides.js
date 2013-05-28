/*global define, d3 */

define(function (require) {
  var nucleotidePaths = require('md2d/views/nucleotide-paths'),

      SCALE = 0.007,
      W = {
        "BACKB": 52,
        "A": 28.151,
        "C": 21.2,
        "G": 21.2,
        "T": 28.651,
        "U": 28.651,
        "A_GLOW": 44.125,
        "C_GLOW": 37.2,
        "G_GLOW": 36.2,
        "T_GLOW": 45.566
      },
      H = {
        "BACKB": 14,
        "A": 31.15,
        "C": 25.3,
        "G": 30.3,
        "T": 25.007,
        "U": 25.007,
        "A_GLOW": 44.55,
        "C_GLOW": 41.417,
        "G_GLOW": 45.3,
        "T_GLOW": 40.65
      };

  (function () {
    var name;
    for (name in W) {
      if (W.hasOwnProperty(name)) {
        W[name] *= SCALE;
      }
    }
    for (name in H) {
      if (H.hasOwnProperty(name)) {
        H[name] *= SCALE;
      }
    }
  }());

  function nucleotides() {
    var m2px = null,
        sequence = "",
        direction = 1,
        startingPos = 0,
        backbone = "DNA", // if enabled, "RNA" or "DNA" is expected.
        stopCodonsHash = null,
        randomEnter = true,
        glow = false,

        xShift = 0,
        yShift = 0;

    function shift(enabled) {
      var t, r;
      if (enabled) {
        // While adding a new mRNA segment, choose a random starting point along a
        // circle with a certain radius that extends beyond the top DNA strand.
        // Use parametric circle equation: x = r cos(t), y = r sin(t)
        // Limit range of the "t" parameter to: [0.25 * PI, 0.75 * PI) and [1.25 * PI, 1.75 * PI),
        // so new mRNA segments will come only from the top or bottom side of the container.
        t = Math.random() >= 0.5 ? Math.PI * 0.25 : Math.PI * 1.25;
        t += Math.random() * Math.PI * 0.5;
        r = nucleotides.HEIGHT * 6;
        xShift = r * Math.cos(t);
        yShift = r * Math.sin(t);
      } else {
        xShift = yShift = 0;
      }
    }

    function translate(d, i) {
      return "translate(" + m2px(xShift + nucleotides.WIDTH * (startingPos + i)) + " " + m2px(yShift) + ")";
    }

    function nucleo(g) {
      g.each(function(d, i) {
        var g = d3.select(this),

            yOffset = backbone ? 0.9 * H.BACKB : 0,
            yStart = m2px(yOffset + 0.5 * H.A),
            yEnd = m2px(yOffset + H.A * 0.97),

            seq = typeof sequence === "function" ? sequence(d, i) : sequence,

            nucleo, nucleoEnter, nucleoShape, nucleoSVG, nucleoTrans,
            targetScale;

        nucleo = g.selectAll("g.nucleotide").data(seq.split(""));
        // Enter.
        // Enable random translation of the new mRNAs.
        shift(randomEnter);
        nucleoEnter = nucleo.enter().append("g").attr({
          "class": "nucleotide",
          "transform": translate
        }).style({
          "opacity": 0
        });

        // Additional container for scaling.
        nucleoEnter = nucleoEnter.append("g").attr({
          "class": "scale",
          "transform": "scale(1, " + (direction  === 1 ? 1 : -1) + ")",
        });

        nucleoEnter.append("path").attr({
          "class": "bonds",
          "d": function (d) {
            if (d === "C" || d === "G") {
              return "M" + m2px(SCALE * 20) + " " + yStart + " L " + m2px(SCALE * 20) + " " + yEnd +
                     "M" + m2px(SCALE * 26) + " " + yStart + " L " + m2px(SCALE * 26) + " " + yEnd +
                     "M" + m2px(SCALE * 32) + " " + yStart + " L " + m2px(SCALE * 32) + " " + yEnd;
            } else {
              return "M" + m2px(SCALE * 22) + " " + yStart + " L " + m2px(SCALE * 22) + " " + yEnd +
                     "M" + m2px(SCALE * 30) + " " + yStart + " L " + m2px(SCALE * 30) + " " + yEnd;
            }
          }
        }).style({
          "stroke-width": m2px(0.01),
          "stroke": "#fff"
        });
        nucleoShape = nucleoEnter.append("g").attr("class", "nucleo-shape");
        if (glow) {
          nucleoShape.append("image").attr({
            "class": "glow",
            "x": function (d) { return m2px(W.BACKB) / 2 - m2px(W[d + "_GLOW"]) / 2; },
            "y": m2px(yOffset - 0.17 * W.G_GLOW),  // move glow closer to the backbone
            "width": function (d) { return m2px(W[d + "_GLOW"]); },
            "height": function (d) { return m2px(H[d + "_GLOW"]); },
            "preserveAspectRatio": "none",
            "xlink:href": function (d) { return "resources/dna/NucleotideGlow_" + d + ".svg"; }
          });
        }
        nucleoSVG = nucleoShape.append("svg").attr({
          "class": "nucleo-shape",
          "overflow": "visible", // glow on hover shouldn't be truncated
          "viewBox": function (d) { return "0 0 " + (W[d] / SCALE) + " " + (H[d] / SCALE); },
          "x": function (d) { return m2px(W.BACKB) / 2 - m2px(W[d]) / 2; },
          "y": m2px(yOffset),
          "width": function (d) { return m2px(W[d]); },
          "height": function (d) { return m2px(H[d]); },
          "preserveAspectRatio": "none"
        });
        nucleoSVG.append("path").attr({
          "class": "outline",
          "fill-rule": "evenodd",
          "clip-rule": "evenodd",
          "d": function (d) { return nucleotidePaths.outline[d]; }
        });
        nucleoSVG.append("path").attr({
          "class": "interior",
          "fill-rule": "evenodd",
          "clip-rule": "evenodd",
          "d": function (d) { return nucleotidePaths.interior[d]; }
        });
        nucleoSVG.append("path").attr({
          "class": "letter",
          "fill-rule": "evenodd",
          "clip-rule": "evenodd"
        });
        if (backbone) {
          nucleoEnter.append("image").attr({
            "class": "backbone",
            "x": 0,
            "y": 0,
            "width": m2px(W.BACKB),
            "height": m2px(H.BACKB),
            "preserveAspectRatio": "none",
            "xlink:href": "resources/dna/Backbone_" + backbone + ".svg"
          });
        }

        // Update. Note that we update things related only to direction and
        // stop-codon class, as for now this is the only use case for update
        // operation. In theory we could update also other properties (e.g.
        // assuming that type of nucletoide can change), but this is not used
        // now, so don't do it (hopefully, we gain some performance).
        nucleo.select("svg").attr("class", function (d, i) {
          var className = "type-" + d;
          if (stopCodonsHash && stopCodonsHash[i]) {
            className += " stop-codon";
          }
          return className;
        });

        shift(false);
        nucleoTrans = d3.transition(nucleo)
          .attr("transform", translate)
          .style("opacity", 1);

        // Duck test whether nucleoTrans is really translation. See D3 API
        // Reference - d3.transition(selection) returns  transition only when
        // called in the context of other transition. Otherwise it returns
        // selection.
        if (nucleoTrans.attrTween) {
          // Scale. We can't simply use .attr, as rotation is used (to make
          // scale change fancier?). attrTween enforces simple change from
          // scale(1,1) to scale(1,-1) without using rotation.
          targetScale  = "scale(1, " + (direction  === 1 ? 1 : -1) + ")";
          nucleoTrans.select("g.scale").attrTween("transform", function(d, i, a) {
            return d3.interpolateString(a, targetScale);
          });
          // Letters. We can use transition as d3.interpolator creates some
          // results which can't be parsed.
          nucleoTrans.each("start", function () {
            nucleo.selectAll("path.letter")
              .attr("d", function (d) { return nucleotidePaths.letter[d][direction]; });
          });
        } else {
          // The same operations, but without using transition.
          nucleo.select("g.scale").attr("transform", "scale(1, " + (direction  === 1 ? 1 : -1) + ")");
          nucleo.selectAll("path.letter")
            .attr("d", function (d) { return nucleotidePaths.letter[d][direction]; });
        }

        // Exit.
        d3.transition(nucleo.exit()).remove();
      });
    }

    nucleo.sequence = function (s) {
      if (!arguments.length) return sequence;
      sequence = s;
      return nucleo;
    };

    nucleo.model2px = function (m) {
      if (!arguments.length) return m2px;
      m2px = m;
      return nucleo;
    };

    nucleo.direction = function (d) {
      if (!arguments.length) return direction;
      direction = d;
      return nucleo;
    };

    nucleo.startingPos = function (p) {
      if (!arguments.length) return startingPos;
      startingPos = p;
      return nucleo;
    };

    nucleo.randomEnter = function (r) {
      if (!arguments.length) return randomEnter;
      randomEnter = r;
      return nucleo;
    };

    /**
     * Enables or disables nucleotide glowing on hover.
     * @param  {boolean} g
     */
    nucleo.glow = function (g) {
      if (!arguments.length) return glow;
      glow = g;
      return nucleo;
    };

    /**
     * @param  {String} b "DNA" or "RNA".
     */
    nucleo.backbone = function (b) {
      if (!arguments.length) return backbone;
      backbone = b;
      return nucleo;
    };

    nucleo.stopCodonsHash = function (s) {
      if (!arguments.length) return stopCodonsHash;
      stopCodonsHash = s;
      return nucleo;
    };

    return nucleo;
  }

  // Width of the nucleotide is width of the DNA backbone.
  // * 0.92 to ensure that DNA backbone doesn't contain any visual discontinuities.
  // There are two bugs connected with it. First is in Chrome, where preserveAspectRatio
  // is ignored for images, the second one is in Safari, which has problems with correct
  // width of the images. Please see:
  // https://www.pivotaltracker.com/story/show/48453261
  nucleotides.WIDTH  = W.BACKB * 0.92;
  // Height of the nucleotide is height of the DNA backbone + A nucleotide (tallest one).
  // * 0.96 because it simply... looks better. This value is used to determine distance
  // between two strands of DNA and this multiplier causes that they are closer to each other.
  nucleotides.HEIGHT = (H.BACKB * 0.9 + H.A) * 0.96;

  return nucleotides;
});
