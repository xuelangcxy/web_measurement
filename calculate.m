function calculate(z,fa,Ra,Xa,fb,Rb,Xb,fc,Rc,Xc,flag)
f=figure('visible','off'); 
 for R=[0 0.2 0.5 1 2 5 10 ];
    for X=[-10 -5 -2 -1  -0.5 -0.2 0.2 0.5  1 2 5 10];%循环输入归一化阻抗
tr=2*pi*(0:0.005:1);
rr=1/(1+R);cr=1-rr;
plot(cr+rr*cos(tr),rr*sin(tr),'k','linewidth',1.4)%画电阻圆
hold on
x=X;
rx=1/x;cx=rx;
tx=2*atan(x)*(0:0.01:1);
if tx<pi
plot(1-rx*sin(tx),cx-rx*cos(tx),'b','linewidth',1.4)%画电抗圆
else
plot(1-rx*sin(tx),-cx-rx*cos(tx),'b','linewidth',1.4)
end
  end
end
t=-1:0.001:1;%画横轴
plot(t,0,'k')
if fa ==''
    return;
else
ra =Ra/z;
xa =Xa/z;
za=ra+i*xa;
tra=real((za-1)/(za+1));
tia=imag((za-1)/(za+1));

Ua=((ra)^2+(xa)^2-1)/((ra)^2+2*(ra)+1+(xa)^2);%转化为坐标值 即Ua Va
Va=2*(xa)/((ra)^2+2*(ra)+1+(xa)^2);
 plot(Ua,Va,'r*')
end
if fb ==''
    return;
else
rb =Rb/z;
xb =Xb/z;    
zb=rb+i*xb;
trb=real((zb-1)/(zb+1));
tib=imag((zb-1)/(zb+1));

Ub=(rb^2+xb^2-1)/(rb^2+2*rb+1+xb^2);%转化为坐标值 即Ub Vb
Vb=2*xb/(rb^2+2*rb+1+xb^2);
 plot(Ub,Vb,'g*')
end
if fc ==''
    return;
else
rc =Rc/z;
xc =Xc/z;
zc=rc+i*xc;
trc=real((zc-1)/(zc+1));
tic=imag((zc-1)/(zc+1));

Uc=(rc^2+xc^2-1)/(rc^2+2*rc+1+xc^2);%转化为坐标值 即Uc Vc
Vc=2*xc/(rc^2+2*rc+1+xc^2);
 plot(Uc,Vc,'m*')
 print(f,'-dpng','/Users/Dapeng/Desktop/web_measurement/public/pic/firstpicture.png')
 result=[ra xa tra tia rb xb trb tib rc xc trc tic]
end