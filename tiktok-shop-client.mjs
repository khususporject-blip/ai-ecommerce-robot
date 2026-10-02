import crypto from "node:crypto";

const BASE_URL = process.env.TTS_API_BASE_URL || "https://open-api.tiktokglobalshop.com";
const APP_KEY = process.env.TTS_APP_KEY || "";
const APP_SECRET = process.env.TTS_APP_SECRET || "";
const ACCESS_TOKEN = process.env.TTS_ACCESS_TOKEN || "";
const SHOP_CIPHER = process.env.TTS_SHOP_CIPHER || "";

function credentials(input = {}) {
  return {
    appKey: input.appKey || APP_KEY,
    appSecret: input.appSecret || APP_SECRET,
    accessToken: input.accessToken || ACCESS_TOKEN,
    shopCipher: input.shopCipher || SHOP_CIPHER
  };
}

function bodyText(body) {
  return body && Object.keys(body).length ? JSON.stringify(body) : "";
}

export function signRequest(path, query = {}, body = {}, appSecret = APP_SECRET, appKey = APP_KEY) {
  if (!appSecret) throw new Error("tts_app_secret_missing");
  const pairs = Object.entries(query)
    .filter(([key, value]) => key !== "sign" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + String(value))
    .join("");
  const payload = path + appKey + pairs + bodyText(body);
  return crypto.createHmac("sha256", appSecret).update(payload).digest("hex");
}

function buildUrl(path, query = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { ...query, app_key: APP_KEY, timestamp };
  params.sign = signRequest(path, params);
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url;
}

export async function ttsRequest(path, { method = "POST", query = {}, body = {}, credentials: suppliedCredentials = {} } = {}) {
  const auth = credentials(suppliedCredentials);
  if (!auth.appKey || !auth.appSecret || !auth.accessToken || !auth.shopCipher) throw new Error("tts_configuration_missing");
  const fullQuery = { ...query, shop_cipher: auth.shopCipher };
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { ...fullQuery, app_key: auth.appKey, timestamp };
  params.sign = signRequest(path, params, body, auth.appSecret, auth.appKey);
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json", "x-tts-access-token": auth.accessToken },
    body: method === "GET" ? undefined : bodyText(body)
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function searchProducts(input = {}) {
  return ttsRequest("/product/202309/products/search", {
    method: "POST",
    credentials: input.credentials,
    query: {
      page_size: Math.max(1, Math.min(100, Number(input.page_size) || 100)),
      ...(input.page_token ? { page_token: String(input.page_token) } : {}),
      ...(input.category_version ? { category_version: String(input.category_version) } : {})
    },
    body: {
      status: input.status || "ACTIVATE",
      ...(Array.isArray(input.seller_skus) ? { seller_skus: input.seller_skus.slice(0, 10) } : {}),
      ...(input.create_time_ge ? { create_time_ge: Number(input.create_time_ge) } : {}),
      ...(input.create_time_le ? { create_time_le: Number(input.create_time_le) } : {}),
      ...(input.update_time_ge ? { update_time_ge: Number(input.update_time_ge) } : {}),
      ...(input.update_time_le ? { update_time_le: Number(input.update_time_le) } : {}),
      ...(input.locale ? { locale: String(input.locale) } : { locale: "id-ID" })
    }
  });
}

export async function searchOrders(input = {}) {
  return ttsRequest("/order/202309/orders/search", {
    method: "POST",
    credentials: input.credentials,
    query: {
      page_size: Math.max(1, Math.min(100, Number(input.page_size) || 100)),
      ...(input.page_token ? { page_token: String(input.page_token) } : {}),
      sort_field: input.sort_field || "update_time",
      sort_order: input.sort_order || "DESC"
    },
    body: {
      ...(input.order_status ? { order_status: String(input.order_status) } : {}),
      ...(input.create_time_ge ? { create_time_ge: Number(input.create_time_ge) } : {}),
      ...(input.create_time_lt ? { create_time_lt: Number(input.create_time_lt) } : {}),
      ...(input.update_time_ge ? { update_time_ge: Number(input.update_time_ge) } : {}),
      ...(input.update_time_lt ? { update_time_lt: Number(input.update_time_lt) } : {})
    }
  });
}

export function normalizeShopProducts(data = {}) {
  const products = Array.isArray(data?.data?.products) ? data.data.products : [];
  return products.map((product) => {
    const skus = Array.isArray(product.skus) ? product.skus : [];
    const quantities = skus.flatMap((sku) => Array.isArray(sku.inventory) ? sku.inventory.map((x) => Number(x.quantity) || 0) : []);
    const prices = skus.map((sku) => Number(sku.price?.sale_price ?? sku.price?.tax_exclusive_price)).filter(Number.isFinite);
    return {
      id: String(product.id || ""),
      name: String(product.title || ""),
      status: String(product.status || ""),
      price: prices.length ? Math.min(...prices) : 0,
      stock: quantities.reduce((sum, value) => sum + value, 0),
      sku_count: skus.length,
      sales_regions: Array.isArray(product.sales_regions) ? product.sales_regions : [],
      create_time: Number(product.create_time) || null,
      update_time: Number(product.update_time) || null
    };
  }).filter((x) => x.id);
}

export function normalizeOrders(data = {}) {
  const orders = Array.isArray(data?.data?.order_list) ? data.data.order_list : [];
  return orders.map((order) => ({
    id: String(order.order_id || order.order_id_str || ""),
    status: String(order.order_status || ""),
    create_time: Number(order.create_time) || null,
    update_time: Number(order.update_time) || null,
    payment: Number(order.payment_info?.original_total_product_price || order.payment_info?.order_amount || 0) || 0
  })).filter((x) => x.id);
}

export async function getProductPerformance(input = {}) {
  return ttsRequest("/analytics/202605/shop_products/performance", {
    method: "GET",
    credentials: input.credentials,
    query: {
      page_size: Math.max(1, Math.min(100, Number(input.page_size) || 100)),
      ...(input.page_token ? { page_token: String(input.page_token) } : {}),
      ...(input.start_date ? { start_date: String(input.start_date) } : {}),
      ...(input.end_date ? { end_date: String(input.end_date) } : {}),
      ...(Array.isArray(input.category_filter) ? { category_filter: input.category_filter.slice(0, 50).map(String) } : {}),
      ...(input.product_status_filter ? { product_status_filter: String(input.product_status_filter) } : {}),
      currency: input.currency === "USD" ? "USD" : "LOCAL"
    }
  });
}

function metricNumber(value) {
  if (value && typeof value === "object") return Number(value.amount ?? value.value ?? 0) || 0;
  return Number(value) || 0;
}

export function normalizeProductPerformance(data = {}) {
  const products = Array.isArray(data?.data?.products) ? data.data.products : [];
  return products.map((product) => {
    const total = product.total_performance || {};
    return {
      product_id: String(product.product_id || product.id || ""),
      product_name: String(product.product_name || product.title || ""),
      total_performance: total,
      seller_live_performance: product.seller_live_performance || {},
      seller_video_performance: product.seller_video_performance || {},
      seller_product_card_performance: product.seller_product_card_performance || {},
      affiliate_total_performance: product.affiliate_total_performance || {},
      affiliate_live_performance: product.affiliate_live_performance || {},
      affiliate_video_performance: product.affiliate_video_performance || {},
      shop_tab_performance: product.shop_tab_performance || {},
      signals: {
        impressions: Number(total.product_impressions) || 0,
        clicks: Number(total.product_clicks) || 0,
        add_to_cart: Number(total.add_cart_count) || 0,
        estimated_customers: Number(total.estimated_customers) || 0,
        gmv: metricNumber(total.gmv_incl_tax ?? total.gross_merchandise_value),
        click_order_rate: Number.parseFloat(total.click_order_rate) || 0,
        ctr: Number.parseFloat(total.ctr) || 0
      }
    };
  }).filter((x) => x.product_id);
}

export const tiktokShopClient = {
  version: "tts-open-api-202605",
  searchProducts,
  searchOrders,
  normalizeShopProducts,
  normalizeOrders,
  getProductPerformance,
  normalizeProductPerformance
};
