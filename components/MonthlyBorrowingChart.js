// Component biểu đồ cột - Thống kê mượn sách theo tháng
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyBorrowingChart = ({ data, period = 'month' }) => {
  // Chuyển đổi dữ liệu
  const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
  
  let labels, counts, chartTitle;

  if (period === 'week') {
    // Hiển thị theo tuần
    labels = data.map(item => item.period); // "Tuần 1", "Tuần 2", ...
    counts = data.map(item => item.count);
    chartTitle = 'Thống kê mượn sách theo tuần (Tháng hiện tại)';
  } else {
    // Hiển thị theo tháng (12 tháng)
    labels = data.map(item => `${monthNames[item.month - 1]} ${item.year}`);
    counts = data.map(item => item.count);
    chartTitle = 'Thống kê mượn sách theo tháng (12 tháng gần nhất)';
  }

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Số lượng mượn sách',
        data: counts,
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: chartTitle,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default MonthlyBorrowingChart;
