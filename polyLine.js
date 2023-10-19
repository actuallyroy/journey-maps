/**
 * Skipped minification because the original files appears to be already minified.
 * Original file: /npm/@googlemaps/polyline-codec@1.0.28/dist/index.umd.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!(function (t, n) {
  "object" == typeof exports && "undefined" != typeof module ? n(exports) : "function" == typeof define && define.amd ? define(["exports"], n) : n(((t = "undefined" != typeof globalThis ? globalThis : t || self).polyline = {}));
})(this, function (t) {
  "use strict";
  var n = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {},
    r = function (t) {
      return t && t.Math == Math && t;
    },
    e =
      r("object" == typeof globalThis && globalThis) ||
      r("object" == typeof window && window) ||
      r("object" == typeof self && self) ||
      r("object" == typeof n && n) ||
      (function () {
        return this;
      })() ||
      Function("return this")(),
    o = {},
    i = function (t) {
      try {
        return !!t();
      } catch (t) {
        return !0;
      }
    },
    u = !i(function () {
      return (
        7 !=
        Object.defineProperty({}, 1, {
          get: function () {
            return 7;
          },
        })[1]
      );
    }),
    c = !i(function () {
      var t = function () {}.bind();
      return "function" != typeof t || t.hasOwnProperty("prototype");
    }),
    f = c,
    a = Function.prototype.call,
    l = f
      ? a.bind(a)
      : function () {
          return a.apply(a, arguments);
        },
    p = {},
    s = {}.propertyIsEnumerable,
    y = Object.getOwnPropertyDescriptor,
    b = y && !s.call({ 1: 2 }, 1);
  p.f = b
    ? function (t) {
        var n = y(this, t);
        return !!n && n.enumerable;
      }
    : s;
  var h,
    v,
    d = function (t, n) {
      return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: n };
    },
    g = c,
    m = Function.prototype,
    w = m.bind,
    O = m.call,
    S = g && w.bind(O, O),
    j = g
      ? function (t) {
          return t && S(t);
        }
      : function (t) {
          return (
            t &&
            function () {
              return O.apply(t, arguments);
            }
          );
        },
    P = j,
    E = P({}.toString),
    T = P("".slice),
    M = j,
    C = i,
    x = function (t) {
      return T(E(t), 8, -1);
    },
    A = e.Object,
    F = M("".split),
    I = C(function () {
      return !A("z").propertyIsEnumerable(0);
    })
      ? function (t) {
          return "String" == x(t) ? F(t, "") : A(t);
        }
      : A,
    L = e.TypeError,
    k = function (t) {
      if (null == t) throw L("Can't call method on " + t);
      return t;
    },
    _ = I,
    z = k,
    D = function (t) {
      return _(z(t));
    },
    N = function (t) {
      return "function" == typeof t;
    },
    R = N,
    G = function (t) {
      return "object" == typeof t ? null !== t : R(t);
    },
    B = e,
    U = N,
    W = function (t) {
      return U(t) ? t : void 0;
    },
    q = function (t, n) {
      return arguments.length < 2 ? W(B[t]) : B[t] && B[t][n];
    },
    K = j({}.isPrototypeOf),
    V = e,
    X = q("navigator", "userAgent") || "",
    Y = V.process,
    $ = V.Deno,
    H = (Y && Y.versions) || ($ && $.version),
    J = H && H.v8;
  J && (v = (h = J.split("."))[0] > 0 && h[0] < 4 ? 1 : +(h[0] + h[1])), !v && X && (!(h = X.match(/Edge\/(\d+)/)) || h[1] >= 74) && (h = X.match(/Chrome\/(\d+)/)) && (v = +h[1]);
  var Q = v,
    Z = i,
    tt =
      !!Object.getOwnPropertySymbols &&
      !Z(function () {
        var t = Symbol();
        return !String(t) || !(Object(t) instanceof Symbol) || (!Symbol.sham && Q && Q < 41);
      }),
    nt = tt && !Symbol.sham && "symbol" == typeof Symbol.iterator,
    rt = q,
    et = N,
    ot = K,
    it = nt,
    ut = e.Object,
    ct = it
      ? function (t) {
          return "symbol" == typeof t;
        }
      : function (t) {
          var n = rt("Symbol");
          return et(n) && ot(n.prototype, ut(t));
        },
    ft = e.String,
    at = N,
    lt = function (t) {
      try {
        return ft(t);
      } catch (t) {
        return "Object";
      }
    },
    pt = e.TypeError,
    st = function (t) {
      if (at(t)) return t;
      throw pt(lt(t) + " is not a function");
    },
    yt = l,
    bt = N,
    ht = G,
    vt = e.TypeError,
    dt = { exports: {} },
    gt = e,
    mt = Object.defineProperty,
    wt = function (t, n) {
      try {
        mt(gt, t, { value: n, configurable: !0, writable: !0 });
      } catch (r) {
        gt[t] = n;
      }
      return n;
    },
    Ot = wt,
    St = "__core-js_shared__",
    jt = e[St] || Ot(St, {}),
    Pt = jt;
  (dt.exports = function (t, n) {
    return Pt[t] || (Pt[t] = void 0 !== n ? n : {});
  })("versions", []).push({ version: "3.22.3", mode: "global", copyright: "© 2014-2022 Denis Pushkarev (zloirock.ru)", license: "https://github.com/zloirock/core-js/blob/v3.22.3/LICENSE", source: "https://github.com/zloirock/core-js" });
  var Et = k,
    Tt = e.Object,
    Mt = function (t) {
      return Tt(Et(t));
    },
    Ct = j({}.hasOwnProperty),
    xt =
      Object.hasOwn ||
      function (t, n) {
        return Ct(Mt(t), n);
      },
    At = j,
    Ft = 0,
    It = Math.random(),
    Lt = At((1).toString),
    kt = function (t) {
      return "Symbol(" + (void 0 === t ? "" : t) + ")_" + Lt(++Ft + It, 36);
    },
    _t = e,
    zt = dt.exports,
    Dt = xt,
    Nt = kt,
    Rt = tt,
    Gt = nt,
    Bt = zt("wks"),
    Ut = _t.Symbol,
    Wt = Ut && Ut.for,
    qt = Gt ? Ut : (Ut && Ut.withoutSetter) || Nt,
    Kt = l,
    Vt = G,
    Xt = ct,
    Yt = function (t, n) {
      var r = t[n];
      return null == r ? void 0 : st(r);
    },
    $t = function (t, n) {
      var r, e;
      if ("string" === n && bt((r = t.toString)) && !ht((e = yt(r, t)))) return e;
      if (bt((r = t.valueOf)) && !ht((e = yt(r, t)))) return e;
      if ("string" !== n && bt((r = t.toString)) && !ht((e = yt(r, t)))) return e;
      throw vt("Can't convert object to primitive value");
    },
    Ht = function (t) {
      if (!Dt(Bt, t) || (!Rt && "string" != typeof Bt[t])) {
        var n = "Symbol." + t;
        Rt && Dt(Ut, t) ? (Bt[t] = Ut[t]) : (Bt[t] = Gt && Wt ? Wt(n) : qt(n));
      }
      return Bt[t];
    },
    Jt = e.TypeError,
    Qt = Ht("toPrimitive"),
    Zt = function (t, n) {
      if (!Vt(t) || Xt(t)) return t;
      var r,
        e = Yt(t, Qt);
      if (e) {
        if ((void 0 === n && (n = "default"), (r = Kt(e, t, n)), !Vt(r) || Xt(r))) return r;
        throw Jt("Can't convert object to primitive value");
      }
      return void 0 === n && (n = "number"), $t(t, n);
    },
    tn = ct,
    nn = function (t) {
      var n = Zt(t, "string");
      return tn(n) ? n : n + "";
    },
    rn = G,
    en = e.document,
    on = rn(en) && rn(en.createElement),
    un = function (t) {
      return on ? en.createElement(t) : {};
    },
    cn =
      !u &&
      !i(function () {
        return (
          7 !=
          Object.defineProperty(un("div"), "a", {
            get: function () {
              return 7;
            },
          }).a
        );
      }),
    fn = u,
    an = l,
    ln = p,
    pn = d,
    sn = D,
    yn = nn,
    bn = xt,
    hn = cn,
    vn = Object.getOwnPropertyDescriptor;
  o.f = fn
    ? vn
    : function (t, n) {
        if (((t = sn(t)), (n = yn(n)), hn))
          try {
            return vn(t, n);
          } catch (t) {}
        if (bn(t, n)) return pn(!an(ln.f, t, n), t[n]);
      };
  var dn = {},
    gn =
      u &&
      i(function () {
        return 42 != Object.defineProperty(function () {}, "prototype", { value: 42, writable: !1 }).prototype;
      }),
    mn = e,
    wn = G,
    On = mn.String,
    Sn = mn.TypeError,
    jn = function (t) {
      if (wn(t)) return t;
      throw Sn(On(t) + " is not an object");
    },
    Pn = u,
    En = cn,
    Tn = gn,
    Mn = jn,
    Cn = nn,
    xn = e.TypeError,
    An = Object.defineProperty,
    Fn = Object.getOwnPropertyDescriptor,
    In = "enumerable",
    Ln = "configurable",
    kn = "writable";
  dn.f = Pn
    ? Tn
      ? function (t, n, r) {
          if ((Mn(t), (n = Cn(n)), Mn(r), "function" == typeof t && "prototype" === n && "value" in r && kn in r && !r.writable)) {
            var e = Fn(t, n);
            e && e.writable && ((t[n] = r.value), (r = { configurable: Ln in r ? r.configurable : e.configurable, enumerable: In in r ? r.enumerable : e.enumerable, writable: !1 }));
          }
          return An(t, n, r);
        }
      : An
    : function (t, n, r) {
        if ((Mn(t), (n = Cn(n)), Mn(r), En))
          try {
            return An(t, n, r);
          } catch (t) {}
        if ("get" in r || "set" in r) throw xn("Accessors not supported");
        return "value" in r && (t[n] = r.value), t;
      };
  var _n = dn,
    zn = d,
    Dn = u
      ? function (t, n, r) {
          return _n.f(t, n, zn(1, r));
        }
      : function (t, n, r) {
          return (t[n] = r), t;
        },
    Nn = { exports: {} },
    Rn = N,
    Gn = jt,
    Bn = j(Function.toString);
  Rn(Gn.inspectSource) ||
    (Gn.inspectSource = function (t) {
      return Bn(t);
    });
  var Un,
    Wn,
    qn,
    Kn = Gn.inspectSource,
    Vn = N,
    Xn = Kn,
    Yn = e.WeakMap,
    $n = Vn(Yn) && /native code/.test(Xn(Yn)),
    Hn = dt.exports,
    Jn = kt,
    Qn = Hn("keys"),
    Zn = {},
    tr = $n,
    nr = e,
    rr = j,
    er = G,
    or = Dn,
    ir = xt,
    ur = jt,
    cr = function (t) {
      return Qn[t] || (Qn[t] = Jn(t));
    },
    fr = Zn,
    ar = "Object already initialized",
    lr = nr.TypeError,
    pr = nr.WeakMap;
  if (tr || ur.state) {
    var sr = ur.state || (ur.state = new pr()),
      yr = rr(sr.get),
      br = rr(sr.has),
      hr = rr(sr.set);
    (Un = function (t, n) {
      if (br(sr, t)) throw new lr(ar);
      return (n.facade = t), hr(sr, t, n), n;
    }),
      (Wn = function (t) {
        return yr(sr, t) || {};
      }),
      (qn = function (t) {
        return br(sr, t);
      });
  } else {
    var vr = cr("state");
    (fr[vr] = !0),
      (Un = function (t, n) {
        if (ir(t, vr)) throw new lr(ar);
        return (n.facade = t), or(t, vr, n), n;
      }),
      (Wn = function (t) {
        return ir(t, vr) ? t[vr] : {};
      }),
      (qn = function (t) {
        return ir(t, vr);
      });
  }
  var dr = {
      set: Un,
      get: Wn,
      has: qn,
      enforce: function (t) {
        return qn(t) ? Wn(t) : Un(t, {});
      },
      getterFor: function (t) {
        return function (n) {
          var r;
          if (!er(n) || (r = Wn(n)).type !== t) throw lr("Incompatible receiver, " + t + " required");
          return r;
        };
      },
    },
    gr = u,
    mr = xt,
    wr = Function.prototype,
    Or = gr && Object.getOwnPropertyDescriptor,
    Sr = mr(wr, "name"),
    jr = Sr && "something" === function () {}.name,
    Pr = Sr && (!gr || (gr && Or(wr, "name").configurable)),
    Er = e,
    Tr = N,
    Mr = xt,
    Cr = Dn,
    xr = wt,
    Ar = Kn,
    Fr = { EXISTS: Sr, PROPER: jr, CONFIGURABLE: Pr }.CONFIGURABLE,
    Ir = dr.get,
    Lr = dr.enforce,
    kr = String(String).split("String");
  (Nn.exports = function (t, n, r, e) {
    var o,
      i = !!e && !!e.unsafe,
      u = !!e && !!e.enumerable,
      c = !!e && !!e.noTargetGet,
      f = e && void 0 !== e.name ? e.name : n;
    Tr(r) && ("Symbol(" === String(f).slice(0, 7) && (f = "[" + String(f).replace(/^Symbol\(([^)]*)\)/, "$1") + "]"), (!Mr(r, "name") || (Fr && r.name !== f)) && Cr(r, "name", f), (o = Lr(r)).source || (o.source = kr.join("string" == typeof f ? f : ""))), t !== Er ? (i ? !c && t[n] && (u = !0) : delete t[n], u ? (t[n] = r) : Cr(t, n, r)) : u ? (t[n] = r) : xr(n, r);
  })(Function.prototype, "toString", function () {
    return (Tr(this) && Ir(this).source) || Ar(this);
  });
  var _r = {},
    zr = Math.ceil,
    Dr = Math.floor,
    Nr = function (t) {
      var n = +t;
      return n != n || 0 === n ? 0 : (n > 0 ? Dr : zr)(n);
    },
    Rr = Nr,
    Gr = Math.max,
    Br = Math.min,
    Ur = Nr,
    Wr = Math.min,
    qr = function (t) {
      return t > 0 ? Wr(Ur(t), 9007199254740991) : 0;
    },
    Kr = D,
    Vr = function (t, n) {
      var r = Rr(t);
      return r < 0 ? Gr(r + n, 0) : Br(r, n);
    },
    Xr = function (t) {
      return qr(t.length);
    },
    Yr = function (t) {
      return function (n, r, e) {
        var o,
          i = Kr(n),
          u = Xr(i),
          c = Vr(e, u);
        if (t && r != r) {
          for (; u > c; ) if ((o = i[c++]) != o) return !0;
        } else for (; u > c; c++) if ((t || c in i) && i[c] === r) return t || c || 0;
        return !t && -1;
      };
    },
    $r = { includes: Yr(!0), indexOf: Yr(!1) },
    Hr = xt,
    Jr = D,
    Qr = $r.indexOf,
    Zr = Zn,
    te = j([].push),
    ne = function (t, n) {
      var r,
        e = Jr(t),
        o = 0,
        i = [];
      for (r in e) !Hr(Zr, r) && Hr(e, r) && te(i, r);
      for (; n.length > o; ) Hr(e, (r = n[o++])) && (~Qr(i, r) || te(i, r));
      return i;
    },
    re = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"].concat("length", "prototype");
  _r.f =
    Object.getOwnPropertyNames ||
    function (t) {
      return ne(t, re);
    };
  var ee = {};
  ee.f = Object.getOwnPropertySymbols;
  var oe = q,
    ie = _r,
    ue = ee,
    ce = jn,
    fe = j([].concat),
    ae =
      oe("Reflect", "ownKeys") ||
      function (t) {
        var n = ie.f(ce(t)),
          r = ue.f;
        return r ? fe(n, r(t)) : n;
      },
    le = xt,
    pe = ae,
    se = o,
    ye = dn,
    be = i,
    he = N,
    ve = /#|\.prototype\./,
    de = function (t, n) {
      var r = me[ge(t)];
      return r == Oe || (r != we && (he(n) ? be(n) : !!n));
    },
    ge = (de.normalize = function (t) {
      return String(t).replace(ve, ".").toLowerCase();
    }),
    me = (de.data = {}),
    we = (de.NATIVE = "N"),
    Oe = (de.POLYFILL = "P"),
    Se = de,
    je = e,
    Pe = o.f,
    Ee = Dn,
    Te = Nn.exports,
    Me = wt,
    Ce = function (t, n, r) {
      for (var e = pe(n), o = ye.f, i = se.f, u = 0; u < e.length; u++) {
        var c = e[u];
        le(t, c) || (r && le(r, c)) || o(t, c, i(n, c));
      }
    },
    xe = Se,
    Ae = i,
    Fe = function (t, n) {
      var r,
        e,
        o,
        i,
        u,
        c = t.target,
        f = t.global,
        a = t.stat;
      if ((r = f ? je : a ? je[c] || Me(c, {}) : (je[c] || {}).prototype))
        for (e in n) {
          if (((i = n[e]), (o = t.noTargetGet ? (u = Pe(r, e)) && u.value : r[e]), !xe(f ? e : c + (a ? "." : "#") + e, t.forced) && void 0 !== o)) {
            if (typeof i == typeof o) continue;
            Ce(i, o);
          }
          (t.sham || (o && o.sham)) && Ee(i, "sham", !0), Te(r, e, i, t);
        }
    },
    Ie = I,
    Le = D,
    ke = function (t, n) {
      var r = [][t];
      return (
        !!r &&
        Ae(function () {
          r.call(
            null,
            n ||
              function () {
                return 1;
              },
            1
          );
        })
      );
    },
    _e = j([].join),
    ze = Ie != Object,
    De = ke("join", ",");
  Fe(
    { target: "Array", proto: !0, forced: ze || !De },
    {
      join: function (t) {
        return _e(Le(this), void 0 === t ? "," : t);
      },
    }
  );
  var Ne = function (t, n) {
      for (var r, e = [], o = [0, 0], i = 0, u = t.length; i < u; ++i) (r = n(t[i])), Re(Be(r[0]) - Be(o[0]), e), Re(Be(r[1]) - Be(o[1]), e), (o = r);
      return e.join("");
    },
    Re = function (t, n) {
      return Ge(t < 0 ? ~(t << 1) : t << 1, n);
    },
    Ge = function (t, n) {
      for (; t >= 32; ) n.push(String.fromCharCode(63 + (32 | (31 & t)))), (t >>= 5);
      return n.push(String.fromCharCode(t + 63)), n;
    },
    Be = function (t) {
      return Math.floor(Math.abs(t) + 0.5) * (t >= 0 ? 1 : -1);
    };
  (t.decode = function (t, n) {
    void 0 === n && (n = 5);
    for (var r = Math.pow(10, n), e = t.length, o = new Array(Math.floor(t.length / 2)), i = 0, u = 0, c = 0, f = 0; i < e; ++f) {
      var a = 1,
        l = 0,
        p = void 0;
      do {
        (a += (p = t.charCodeAt(i++) - 63 - 1) << l), (l += 5);
      } while (p >= 31);
      (u += 1 & a ? ~(a >> 1) : a >> 1), (a = 1), (l = 0);
      do {
        (a += (p = t.charCodeAt(i++) - 63 - 1) << l), (l += 5);
      } while (p >= 31);
      (c += 1 & a ? ~(a >> 1) : a >> 1), (o[f] = [u / r, c / r]);
    }
    return (o.length = f), o;
  }),
    (t.encode = function (t, n) {
      void 0 === n && (n = 5);
      var r = Math.pow(10, n);
      return Ne(t, function (t) {
        return Array.isArray(t) || (t = [t.lat, t.lng]), [Be(t[0] * r), Be(t[1] * r)];
      });
    }),
    (t.polylineEncodeLine = Ne),
    Object.defineProperty(t, "__esModule", { value: !0 });
});
