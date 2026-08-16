#for i in range(3, 5):
#    print(i)

#for i in range(1, 10,-1):  #-1 is the step value, which means the loop will decrement the value of i by 1 in each iteration. However, since the starting value (1) is less than the ending value (10), the loop will not execute any iterations. Therefore, nothing will be printed.
#    print(i)


#for i in range(10): # 0 to 9, 10 Times
#     print("Hello World!")

#for test_id in range(1,6):
#    print("Running the test case : ",test_id)

#for i in range(101):  # 0 to 100
#    if i % 2 == 0:
#        print(i)

for number in range(10):
    if number % 2 == 0:
        continue
    else:
        print(number)        