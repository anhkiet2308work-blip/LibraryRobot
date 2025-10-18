// API endpoint cho thống kê toàn hệ thống (admin)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { period = 'month' } = req.query; // month hoặc week

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Thống kê tổng quan hệ thống
    const [
      { count: totalUsers },
      { count: totalBooks },
      { count: totalOrders },
      { count: activeOrders }
    ] = await Promise.all([
      supabase.from('user').select('*', { count: 'exact', head: true }),
      supabase.from('book').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    const overview = [{
      total_users: totalUsers || 0,
      total_books: totalBooks || 0,
      total_orders: totalOrders || 0,
      active_orders: activeOrders || 0
    }];

    let borrowingData = [];

    if (period === 'week') {
      // Thống kê theo tuần (4 tuần trong tháng hiện tại) - TOÀN HỆ THỐNG
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('order_id, ts_created')
        .gte('ts_created', firstDayOfMonth.toISOString())
        .lte('ts_created', lastDayOfMonth.toISOString())
        .order('ts_created', { ascending: true });

      if (ordersError) {
        console.error('Orders error:', ordersError);
        return res.status(500).json({ error: ordersError.message });
      }

      // Nhóm theo tuần (4 tuần)
      const weekStats = { 1: 0, 2: 0, 3: 0, 4: 0 };
      orders?.forEach(order => {
        const date = new Date(order.ts_created);
        const dayOfMonth = date.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7); // Tuần 1-4
        if (weekNumber >= 1 && weekNumber <= 4) {
          weekStats[weekNumber]++;
        }
      });

      borrowingData = [
        { period: 'Tuần 1', count: weekStats[1] },
        { period: 'Tuần 2', count: weekStats[2] },
        { period: 'Tuần 3', count: weekStats[3] },
        { period: 'Tuần 4', count: weekStats[4] }
      ];

    } else {
      // Thống kê theo tháng (12 tháng gần nhất) - TOÀN HỆ THỐNG
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('order_id, ts_created')
        .gte('ts_created', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('ts_created', { ascending: false });

      if (ordersError) {
        console.error('Orders error:', ordersError);
        return res.status(500).json({ error: ordersError.message });
      }

      // Tạo 12 tháng mặc định (tháng hiện tại + 11 tháng trước)
      const now = new Date();
      const monthsData = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const key = `${year}-${month}`;
        monthsData[key] = { month, year, count: 0 };
      }

      // Đếm orders cho từng tháng
      orders?.forEach(order => {
        const date = new Date(order.ts_created);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        if (monthsData[key]) {
          monthsData[key].count++;
        }
      });

      borrowingData = Object.values(monthsData);
    }

    // Thống kê tình trạng trả sách (toàn hệ thống)
    const { data: orderDetails, error: detailsError } = await supabase
      .from('order_detail')
      .select('return_timestamp');

    if (detailsError) {
      console.error('Order details error:', detailsError);
      return res.status(500).json({ error: detailsError.message });
    }

    // Đếm đã trả / chưa trả
    const returned = orderDetails?.filter(d => d.return_timestamp !== null).length || 0;
    const notReturned = orderDetails?.filter(d => d.return_timestamp === null).length || 0;

    const returnStatusData = [];
    if (returned > 0) returnStatusData.push({ status: 'Đã trả', count: returned });
    if (notReturned > 0) returnStatusData.push({ status: 'Chưa trả', count: notReturned });

    res.status(200).json({
      borrowingData: borrowingData,
      returnStatus: returnStatusData,
      overview: overview,
      period: period
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ error: error.message });
  }
}
