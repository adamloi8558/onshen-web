import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, Coins as CoinsIcon } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  phone: string;
  is_vip: boolean;
  vip_expires_at: Date | null;
  coins: number;
  created_at: Date;
}

interface VIPMembershipCardProps {
  user: User;
}

export default function VIPMembershipCard({ user }: VIPMembershipCardProps) {
  const isVipActive = user.is_vip && user.vip_expires_at && new Date(user.vip_expires_at) > new Date();
  const daysLeft = user.vip_expires_at ? Math.max(0, Math.ceil((new Date(user.vip_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Card className={`relative overflow-hidden ${
      isVipActive 
        ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-300' 
        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border-gray-300'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4">
          <Crown className="h-24 w-24" />
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="text-6xl font-bold opacity-20">
            {isVipActive ? 'VIP' : 'MEMBER'}
          </div>
        </div>
      </div>

      <CardContent className="relative p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">
                {isVipActive ? 'V1 Member' : 'Member'}
              </h3>
              <p className="text-sm opacity-80">
                {user.phone}
              </p>
            </div>
            <Badge className={`${
              isVipActive 
                ? 'bg-black text-yellow-400 border-black' 
                : 'bg-white text-gray-800 border-gray-400'
            }`}>
              {isVipActive ? 'VIP' : 'Member'}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4">
            {isVipActive ? (
              <div>
                <p className="text-xs opacity-80 uppercase tracking-wide">
                  Days Left
                </p>
                <p className="text-xl font-bold">
                  {daysLeft}
                </p>
                <p className="text-xs opacity-80">
                  วัน
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs opacity-80 uppercase tracking-wide">
                  Privileges in Total
                </p>
                <p className="text-xl font-bold">
                  0
                </p>
                <p className="text-xs opacity-80">
                  สิทธิพิเศษ
                </p>
              </div>
            )}
          </div>

          {/* Expiry Date */}
          {isVipActive && user.vip_expires_at && (
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Calendar className="h-4 w-4" />
              <span>
                หมดอายุ: {new Date(user.vip_expires_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!isVipActive && (
              <Button 
                asChild 
                className={`flex-1 ${
                  isVipActive 
                    ? 'bg-black text-yellow-400 hover:bg-gray-800' 
                    : 'bg-yellow-500 text-black hover:bg-yellow-600'
                }`}
              >
                <Link href="/vip">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Link>
              </Button>
            )}
            <Button 
              asChild 
              variant={isVipActive ? "outline" : "secondary"}
              className={`flex-1 ${
                isVipActive 
                  ? 'border-black text-black hover:bg-black hover:text-yellow-400' 
                  : ''
              }`}
            >
              <Link href="/vip">
                <CoinsIcon className="h-4 w-4 mr-2" />
                ต่ออายุ
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}