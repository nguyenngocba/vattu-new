const express = require('express');

module.exports = function forecastRoutes({ pool }) {
  const router = express.Router();

  router.get('/api/forecast', async (req, res) => {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const forecast = await pool.query(
        `SELECT
           m.id,
           m.name,
           m.unit,
           m.qty as current_stock,
           m.low as min_stock,
           COALESCE(SUM(CASE WHEN t.type = 'usage' AND t.datetime >= $1 THEN t.qty ELSE 0 END), 0) as total_exported
         FROM materials m
         LEFT JOIN transactions t ON t.mid = m.id
         GROUP BY m.id, m.name, m.unit, m.qty, m.low
         ORDER BY m.name`,
        [threeMonthsAgo]
      );

      const result = forecast.rows.map((row) => {
        const totalExported = Number(row.total_exported || 0);
        const currentStock = Number(row.current_stock || 0);
        const minStock = Number(row.min_stock || 0);
        const avgMonthlyUsage = totalExported / 3;
        const suggestedOrder = Math.max(0, Math.ceil((avgMonthlyUsage * 2) - currentStock));

        let status = 'ĐỦ';
        let warningLevel = 'good';

        if (currentStock <= minStock) {
          status = 'CẦN NHẬP NGAY';
          warningLevel = 'danger';
        } else if (totalExported > 0 && currentStock < avgMonthlyUsage) {
          status = 'SẮP HẾT';
          warningLevel = 'warning';
        } else if (totalExported === 0) {
          status = 'CHƯA XUẤT';
          warningLevel = 'info';
        }

        return {
          id: row.id,
          name: row.name,
          unit: row.unit,
          current_stock: currentStock,
          min_stock: minStock,
          total_exported: totalExported,
          avg_monthly_usage: Math.ceil(avgMonthlyUsage),
          suggested_order: suggestedOrder,
          status,
          warning_level: warningLevel
        };
      });

      res.json({ success: true, data: result });
    } catch (e) {
      console.error('Forecast API error:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  router.get('/api/forecast-projects', async (req, res) => {
    try {
      const projects = await pool.query('SELECT * FROM projects');
      const txns = await pool.query("SELECT * FROM transactions WHERE type IN ('usage','return')");
      const result = projects.rows.map((p) => {
        const spent = txns.rows.filter((t) => t.project_id === p.id && t.type === 'usage').reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const ret = txns.rows.filter((t) => t.project_id === p.id && t.type === 'return').reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const net = spent - ret;
        const remain = Number(p.budget) - net;
        const pct = Number(p.budget) > 0 ? (net / Number(p.budget) * 100) : 0;
        let status = 'OK';
        let estMonths = '—';
        if (remain < 0) { status = 'VƯỢT NS'; estMonths = 0; }
        else if (pct > 90) { status = 'SẮP HẾT'; estMonths = Math.ceil(remain / ((net || 1) / 3)) || '—'; }
        else if (pct > 50) { status = 'ĐANG THI CÔNG'; estMonths = Math.ceil(remain / ((net || 1) / 3)) || '—'; }
        else { status = 'MỚI BẮT ĐẦU'; estMonths = Math.ceil(remain / ((net || 1) / 3)) || '—'; }
        return { id: p.id, name: p.name, budget: p.budget, spent: net, remain, pct: pct.toFixed(1), status, estMonths };
      });
      res.json({ success: true, data: result });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.get('/api/forecast-structures', async (req, res) => {
    try {
      const structures = await pool.query('SELECT * FROM structures');
      const txns = await pool.query("SELECT * FROM transactions WHERE type = 'structure_export'");
      const result = structures.rows.map((s) => {
        const exports = txns.rows.filter((t) => t.mid === s.id);
        const totalExported = exports.reduce((sum, t) => sum + Number(t.qty || 0), 0);
        const firstExport = exports.length > 0 ? new Date(exports[exports.length - 1].datetime || new Date()) : new Date();
        const months = Math.max(1, (new Date() - firstExport) / (30 * 24 * 60 * 60 * 1000));
        const avgMonthly = totalExported / months;
        const stock = Number(s.qty || 0);
        const estMonths = avgMonthly > 0 ? (stock / avgMonthly).toFixed(1) : '99+';
        const status = estMonths > 3 ? 'ĐỦ' : estMonths > 1 ? 'SẮP HẾT' : 'CẦN SX';
        return { id: s.id, name: s.name, unit: s.unit, stock, avgMonthly: avgMonthly.toFixed(1), estMonths, status };
      });
      res.json({ success: true, data: result });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  return router;
};
