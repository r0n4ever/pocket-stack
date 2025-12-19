import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Task01Icon, 
  Add01Icon,
  RefreshIcon,
  Search01Icon,
  PencilEdit01Icon,
  Delete01Icon,
  Bookmark01Icon,
  CheckmarkCircle01Icon,
  HourglassIcon,
  MoreHorizontalIcon,
  Calendar01Icon,
  ArrowUpDownIcon,
  FilterIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArchiveIcon,
} from '@hugeicons/core-free-icons';
import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  user: string;
  archived: boolean;
  created: string;
  updated: string;
}

const statusMap = {
  todo: { label: '待办', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', icon: Bookmark01Icon },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', icon: HourglassIcon },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400', icon: CheckmarkCircle01Icon },
};

const priorityMap = {
  low: { label: '低', color: 'text-neutral-500' },
  medium: { label: '中', color: 'text-blue-500' },
  high: { label: '高', color: 'text-red-500' },
};

export function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('tasks-sort-pref') || '-updated');

  useEffect(() => {
    localStorage.setItem('tasks-sort-pref', sortBy);
  }, [sortBy]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
  });

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filters: string[] = [
        `user = "${user.id}"`,
        `archived = ${showArchived}`
      ];
      
      if (searchTerm) {
        filters.push(`(title ~ "${searchTerm}" || description ~ "${searchTerm}")`);
      }
      
      if (filterStatus !== 'all') {
        filters.push(`status = "${filterStatus}"`);
      }
      
      if (filterPriority !== 'all') {
        filters.push(`priority = "${filterPriority}"`);
      }
      
      if (filterTime !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        if (filterTime === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (filterTime === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (filterTime === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }
        
        const formattedDate = startDate.toISOString().replace('T', ' ').split('.')[0];
        filters.push(`created >= "${formattedDate}"`);
      }
      
      const filterString = filters.join(' && ');
        
      const result = await pb.collection('tasks').getFullList<Task>({
        sort: sortBy,
        filter: filterString,
      });
      setTasks(result);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortBy(`-${field}`);
    } else if (sortBy === `-${field}`) {
      setSortBy(field);
    } else {
      // Default to descending for dates/priority, ascending for text
      if (field === 'title') {
        setSortBy(field);
      } else {
        setSortBy(`-${field}`);
      }
    }
  };

  const getSortIcon = (field: string) => {
    const isSorted = sortBy === field || sortBy === `-${field}`;
    const isDesc = sortBy === `-${field}`;
    
    if (!isSorted) {
      return <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-1.5 h-3.5 w-3.5 opacity-20 group-hover:opacity-50 transition-opacity" />;
    }
    
    return isDesc 
      ? <HugeiconsIcon icon={ArrowDown01Icon} className="ml-1.5 h-3.5 w-3.5 text-blue-500" />
      : <HugeiconsIcon icon={ArrowUp01Icon} className="ml-1.5 h-3.5 w-3.5 text-blue-500" />;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortBy, searchTerm, filterStatus, filterPriority, filterTime, showArchived]);

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        user: user.id,
      };

      if (editingTask) {
        await pb.collection('tasks').update(editingTask.id, data);
      } else {
        await pb.collection('tasks').create(data);
      }
      setIsDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      console.error('Failed to save task:', error);
      alert('保存失败，请检查网络或后端配置。\n' + (error.message || ''));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除个任务吗？')) {
      try {
        await pb.collection('tasks').delete(id);
        fetchTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const toggleArchive = async (task: Task) => {
    try {
      await pb.collection('tasks').update(task.id, { archived: !task.archived });
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const updateStatus = async (task: Task, newStatus: Task['status']) => {
    try {
      await pb.collection('tasks').update(task.id, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            任务管理
          </h1>
          <p className="mt-1.5 text-neutral-500 dark:text-neutral-400">
            高效管理您的个人待办事项与工作项
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchTasks()} disabled={loading} className="rounded-xl h-10 w-10 bg-white dark:bg-neutral-950">
            <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-lg shadow-blue-500/20 transition-all active:scale-95" onClick={() => handleOpenDialog()}>
            <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
            新建任务
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="搜索任务标题或描述..."
              className="pl-10 bg-white dark:bg-neutral-950 h-11 border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm focus-visible:ring-blue-500/20 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-neutral-500">
            <HugeiconsIcon icon={FilterIcon} className="h-3.5 w-3.5" />
            <span>筛选条件:</span>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[110px] h-9 rounded-lg bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-medium">
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800 p-1 shadow-lg">
              <SelectItem value="all" className="rounded-lg py-1.5 text-xs">所有状态</SelectItem>
              <SelectItem value="todo" className="rounded-lg py-1.5 text-xs">待办事项</SelectItem>
              <SelectItem value="in_progress" className="rounded-lg py-1.5 text-xs">进行中</SelectItem>
              <SelectItem value="completed" className="rounded-lg py-1.5 text-xs">已完成</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[110px] h-9 rounded-lg bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-medium">
              <SelectValue placeholder="所有优先级" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800 p-1 shadow-lg">
              <SelectItem value="all" className="rounded-lg py-1.5 text-xs">所有优先级</SelectItem>
              <SelectItem value="low" className="rounded-lg py-1.5 text-xs text-neutral-500">低优先级</SelectItem>
              <SelectItem value="medium" className="rounded-lg py-1.5 text-xs text-blue-500">中优先级</SelectItem>
              <SelectItem value="high" className="rounded-lg py-1.5 text-xs text-red-500 font-bold">高优先级</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-[110px] h-9 rounded-lg bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-xs font-medium">
              <SelectValue placeholder="所有时间" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800 p-1 shadow-lg">
              <SelectItem value="all" className="rounded-lg py-1.5 text-xs">所有时间</SelectItem>
              <SelectItem value="today" className="rounded-lg py-1.5 text-xs">今天创建</SelectItem>
              <SelectItem value="week" className="rounded-lg py-1.5 text-xs">最近7天</SelectItem>
              <SelectItem value="month" className="rounded-lg py-1.5 text-xs">最近30天</SelectItem>
            </SelectContent>
          </Select>

          {(filterStatus !== 'all' || filterPriority !== 'all' || filterTime !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterTime('all');
              }}
              className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold transition-colors"
            >
              重置筛选
            </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "h-9 px-3 gap-2 rounded-lg text-xs font-bold transition-all",
              showArchived 
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400" 
                : "text-neutral-500 hover:bg-neutral-100"
            )}
          >
            <HugeiconsIcon icon={ArchiveIcon} className="h-3.5 w-3.5" />
            {showArchived ? "查看活跃任务" : "查看归档箱"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/50 dark:bg-neutral-950/50 border-b border-neutral-100 dark:border-neutral-800 hover:bg-transparent">
                <TableHead 
                  className="w-[40%] h-14 px-6 font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    任务详情
                    {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[15%] h-14 font-bold text-neutral-900 dark:text-neutral-100 text-center cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center">
                    状态
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[15%] h-14 font-bold text-neutral-900 dark:text-neutral-100 text-center cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center justify-center">
                    优先级
                    {getSortIcon('priority')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[15%] h-14 font-bold text-neutral-900 dark:text-neutral-100 text-center cursor-pointer group select-none transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                  onClick={() => handleSort('updated')}
                >
                  <div className="flex items-center justify-center">
                    最近更新
                    {getSortIcon('updated')}
                  </div>
                </TableHead>
                <TableHead className="w-[15%] h-14 px-6 text-right font-bold text-neutral-900 dark:text-neutral-100 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && tasks.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-neutral-50 dark:border-neutral-800">
                    <TableCell className="px-6 py-5"><div className="h-5 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-lg" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg mx-auto" /></TableCell>
                    <TableCell><div className="h-5 w-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg mx-auto" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg mx-auto" /></TableCell>
                    <TableCell className="px-6"><div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-5 rounded-full bg-blue-50 dark:bg-blue-900/10 animate-fade-in">
                        <HugeiconsIcon icon={Task01Icon} className="h-10 w-10 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">暂待办事项</p>
                        <p className="text-sm text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                          每一项伟大的成就都始于一个微小的任务。现在就开始规划您的蓝图吧。
                        </p>
                      </div>
                      <Button onClick={() => handleOpenDialog()} className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                        立即创建任务
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition-colors duration-200">
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 font-medium">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-lg text-[11px] px-2.5 py-0.5 border-none font-bold uppercase tracking-tight inline-flex items-center",
                        statusMap[task.status].color
                      )}>
                        <HugeiconsIcon icon={statusMap[task.status].icon} className="mr-1.5 h-3.5 w-3.5" />
                        {statusMap[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          task.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" :
                          task.priority === 'medium' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "bg-neutral-300"
                        )} />
                        <span className={cn("text-xs font-bold", priorityMap[task.priority].color)}>
                          {priorityMap[task.priority].label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-medium">
                        <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5" />
                        {new Date(task.updated).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all">
                            <HugeiconsIcon icon={MoreHorizontalIcon} className="h-5 w-5 text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                          <DropdownMenuLabel className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] px-3 py-2">
                            变更任务状态
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => updateStatus(task, 'todo')} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-neutral-50 dark:focus:bg-neutral-800 transition-colors text-sm font-medium">
                            <HugeiconsIcon icon={Bookmark01Icon} className="h-4 w-4 text-neutral-400" />
                            <span>设为待办</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(task, 'in_progress')} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-colors text-sm font-medium">
                            <HugeiconsIcon icon={HourglassIcon} className="h-4 w-4 text-blue-500" />
                            <span>推进中...</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(task, 'completed')} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-green-50 dark:focus:bg-green-900/20 transition-colors text-sm font-medium">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-500" />
                            <span>完成任务!</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => toggleArchive(task)} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-amber-50 dark:focus:bg-amber-900/20 transition-colors text-sm font-medium">
                            <HugeiconsIcon icon={ArchiveIcon} className="h-4 w-4 text-amber-500" />
                            <span>{task.archived ? '取消归档' : '移入归档箱'}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="my-2 bg-neutral-100 dark:bg-neutral-800" />
                          
                          <DropdownMenuLabel className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em] px-3 py-2">
                            常规管理
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenDialog(task)} className="rounded-xl gap-3 cursor-pointer py-2.5 focus:bg-neutral-50 dark:focus:bg-neutral-800 transition-colors text-sm font-medium">
                            <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 text-blue-600" />
                            <span>编辑详细内容</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(task.id)} className="rounded-xl gap-3 cursor-pointer py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 transition-colors text-sm font-medium">
                            <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                            <span>永久移除</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-10 text-white relative">
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tight">{editingTask ? '编辑任务详情' : '开启新挑战'}</DialogTitle>
              <DialogDescription className="text-blue-100 mt-2 text-base font-medium">
                {editingTask ? '细化任务目标，保持工作节奏。' : '定义您的下一个重要里程碑。'}
              </DialogDescription>
            </div>
            <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white dark:bg-neutral-950">
            <div className="space-y-2.5">
              <Label htmlFor="title" className="text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">任务名称</Label>
              <Input
                id="title"
                placeholder="例如: 🚀 发布 1.0 版本核心代码"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-12 border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 px-4 focus-visible:ring-blue-500/20 font-medium transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">当前状况</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as Task['status'] })}>
                  <SelectTrigger className="h-12 border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 px-4 focus-visible:ring-blue-500/20 font-medium transition-all">
                    <SelectValue placeholder="设置进度" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-neutral-200 dark:border-neutral-800 p-1.5 shadow-xl">
                    <SelectItem value="todo" className="rounded-xl py-2.5">待办事项</SelectItem>
                    <SelectItem value="in_progress" className="rounded-xl py-2.5 text-blue-600">进行中</SelectItem>
                    <SelectItem value="completed" className="rounded-xl py-2.5 text-green-600">已圆满完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">优先级</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val as Task['priority'] })}>
                  <SelectTrigger className="h-12 border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 px-4 focus-visible:ring-blue-500/20 font-medium transition-all">
                    <SelectValue placeholder="重要程度" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-neutral-200 dark:border-neutral-800 p-1.5 shadow-xl">
                    <SelectItem value="low" className="rounded-xl py-2.5">低 (不紧急)</SelectItem>
                    <SelectItem value="medium" className="rounded-xl py-2.5 text-blue-500 font-bold">中 (正常推进)</SelectItem>
                    <SelectItem value="high" className="rounded-xl py-2.5 text-red-600 font-black">高 (立刻处理!)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">任务备注</Label>
              <Textarea
                id="description"
                placeholder="在此记录任务的关键细节、依赖项或备忘内容..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 p-4 focus-visible:ring-blue-500/20 font-medium transition-all"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl flex-1 h-12 font-bold text-neutral-500 hover:bg-neutral-100 active:scale-95 transition-all">
                放弃更改
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex-[2] h-12 font-bold shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
                {editingTask ? '保存并同步' : '立即创建任务'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
